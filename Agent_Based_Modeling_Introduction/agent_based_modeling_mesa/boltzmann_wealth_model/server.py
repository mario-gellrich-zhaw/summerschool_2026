from __future__ import annotations

import itertools
import threading
import time
from concurrent.futures import ProcessPoolExecutor

import pandas as pd
from flask import Flask, jsonify, request
from mesa.examples.basic.boltzmann_wealth_model.model import BoltzmannScenario, BoltzmannWealth

from sensitivity_core import run_one_simulation_kwargs

app = Flask(__name__, static_folder="static", static_url_path="")

MAX_SENSITIVITY_RUNS = 2500
MODEL_FIELDS = {"n", "width", "height", "seed"}

_lock = threading.Lock()
_model: BoltzmannWealth | None = None
_max_steps: int | None = None


def _parse_max_steps(value) -> int | None:
    max_steps = int(value or 0)
    return max_steps if max_steps > 0 else None


def _current_step() -> int:
    return max(0, len(_history_df()) - 1)


def _sync_running_state() -> None:
    if _model is None:
        return
    if _max_steps is not None and _current_step() >= _max_steps:
        _model.running = False


def _parse_model_params(params: dict) -> dict:
    return {
        "n": int(params.get("n", 80)),
        "width": int(params.get("width", 20)),
        "height": int(params.get("height", 20)),
        "seed": int(params.get("seed", 42)),
        "max_steps": _parse_max_steps(params.get("max_steps", 0)),
    }


def _build_model(params: dict) -> BoltzmannWealth:
    scenario = BoltzmannScenario(
        n=params["n"],
        width=params["width"],
        height=params["height"],
        rng=params["seed"],
    )
    return BoltzmannWealth(scenario=scenario)


def _history_df() -> pd.DataFrame:
    return _model.datacollector.get_model_vars_dataframe().reset_index(drop=True)


def _wealth_values() -> list[int]:
    return [int(agent.wealth) for agent in _model.agents]


def _top_wealth_share(wealth_values: list[int]) -> float:
    if not wealth_values:
        return 0.0
    total_wealth = sum(wealth_values)
    if total_wealth == 0:
        return 0.0
    top_count = max(1, int(round(len(wealth_values) * 0.1)))
    richest = sorted(wealth_values, reverse=True)[:top_count]
    return sum(richest) / total_wealth


def _zero_wealth_share(wealth_values: list[int]) -> float:
    if not wealth_values:
        return 0.0
    return sum(1 for value in wealth_values if value == 0) / len(wealth_values)


def _wealth_histogram(wealth_values: list[int]) -> list[dict[str, int]]:
    counts: dict[int, int] = {}
    for value in wealth_values:
        counts[value] = counts.get(value, 0) + 1
    return [
        {"wealth": wealth, "count": count}
        for wealth, count in sorted(counts.items())
    ]


def _agent_dicts() -> list[dict[str, int]]:
    agents = []
    for agent in _model.agents:
        x, y = agent.cell.coordinate
        agents.append({"x": x, "y": y, "wealth": int(agent.wealth)})
    return agents


def _state() -> dict:
    history_df = _history_df()
    wealth_values = _wealth_values()
    latest_gini = float(history_df["Gini"].iloc[-1]) if not history_df.empty else 0.0
    total_wealth = int(sum(wealth_values))
    population = len(wealth_values)
    step = max(0, len(history_df) - 1)
    running = _model.running and (_max_steps is None or step < _max_steps)
    return {
        "step": step,
        "max_steps": _max_steps,
        "width": _model.grid.width,
        "height": _model.grid.height,
        "agents": _agent_dicts(),
        "wealth_histogram": _wealth_histogram(wealth_values),
        "summary": {
            "population": population,
            "total_wealth": total_wealth,
            "average_wealth": (total_wealth / population) if population else 0.0,
            "gini": latest_gini,
            "richest_wealth": max(wealth_values) if wealth_values else 0,
            "zero_wealth_share": _zero_wealth_share(wealth_values),
            "top10_wealth_share": _top_wealth_share(wealth_values),
        },
        "history": {
            "steps": list(range(len(history_df))),
            "gini": [float(value) for value in history_df["Gini"].tolist()],
        },
        "running": running,
    }


@app.route("/api/reset", methods=["POST"])
def reset():
    global _model, _max_steps
    params = request.get_json(silent=True) or {}
    with _lock:
        model_params = _parse_model_params(params)
        _max_steps = model_params["max_steps"]
        _model = _build_model(model_params)
        _sync_running_state()
        return jsonify(_state())


@app.route("/api/step", methods=["POST"])
def step():
    n = request.args.get("n", default=1, type=int)
    with _lock:
        if _model is None:
            return jsonify({"error": "Model not initialized, call /api/reset first"}), 400
        _sync_running_state()
        remaining_steps = None if _max_steps is None else max(0, _max_steps - _current_step())
        steps_to_run = max(1, n) if remaining_steps is None else min(max(1, n), remaining_steps)
        for _ in range(steps_to_run):
            _model.step()
        _sync_running_state()
        return jsonify(_state())


@app.route("/api/state", methods=["GET"])
def state():
    with _lock:
        if _model is None:
            return jsonify({"error": "Model not initialized, call /api/reset first"}), 400
        return jsonify(_state())


def _axis_values(spec: dict, cast=int) -> list[int]:
    lo = float(spec["min"])
    hi = float(spec["max"])
    step = float(spec["step"])
    values = []
    n = 0
    value = lo
    while value <= hi + 1e-9:
        values.append(cast(round(value, 10)))
        n += 1
        value = lo + n * step
    return values


def _json_metric_matrix(table: pd.DataFrame) -> list[list[float | None]]:
    return [
        [None if pd.isna(value) else float(value) for value in row]
        for row in table.values.tolist()
    ]


@app.route("/api/sensitivity", methods=["POST"])
def sensitivity():
    body = request.get_json(silent=True) or {}

    fixed_params = {k: v for k, v in (body.get("fixed_params") or {}).items() if k in MODEL_FIELDS}
    fixed_params.pop("n", None)

    agent_count_values = _axis_values(body.get("n", {}), cast=int)
    step_values = _axis_values(body.get("n_steps", {}), cast=int)
    replications = int(body.get("replications", 5))

    total_runs = len(agent_count_values) * len(step_values) * replications
    if total_runs == 0:
        return jsonify({"error": "Parameter ranges produced an empty grid"}), 400
    if total_runs > MAX_SENSITIVITY_RUNS:
        return jsonify(
            {
                "error": f"Requested {total_runs} runs, which exceeds the limit of {MAX_SENSITIVITY_RUNS}. Reduce the grid size or replications."
            }
        ), 400

    runs = [
        {
            "n": agent_count,
            "n_steps": steps,
            "replication": replication,
            "fixed_params": fixed_params,
        }
        for agent_count, steps in itertools.product(agent_count_values, step_values)
        for replication in range(replications)
    ]

    start = time.perf_counter()
    try:
        with ProcessPoolExecutor() as executor:
            results = list(executor.map(run_one_simulation_kwargs, runs))
    except Exception as exc:
        return jsonify({"error": f"Sensitivity analysis failed: {exc}"}), 500
    elapsed = time.perf_counter() - start

    df = pd.DataFrame(results)
    summary = df.groupby(["n", "n_steps"]).agg(
        mean_final_gini=("final_gini", "mean"),
        mean_top10_wealth_share=("top10_wealth_share", "mean"),
        mean_zero_wealth_share=("zero_wealth_share", "mean"),
        mean_richest_wealth=("richest_wealth", "mean"),
    )

    metrics = {}
    for metric in (
        "mean_final_gini",
        "mean_top10_wealth_share",
        "mean_zero_wealth_share",
        "mean_richest_wealth",
    ):
        table = summary[metric].unstack().reindex(index=agent_count_values, columns=step_values)
        metrics[metric] = _json_metric_matrix(table)

    return jsonify(
        {
            "agent_count_values": agent_count_values,
            "step_values": step_values,
            "metrics": metrics,
            "n_runs": total_runs,
            "elapsed_seconds": round(elapsed, 1),
        }
    )


@app.route("/")
def index():
    return app.send_static_file("index.html")


if __name__ == "__main__":
    app.run(port=8003, debug=True, threaded=True, use_reloader=False)