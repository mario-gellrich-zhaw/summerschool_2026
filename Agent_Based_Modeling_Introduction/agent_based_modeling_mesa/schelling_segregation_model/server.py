"""Flask backend exposing the Mesa Schelling segregation model to a hand-built JS/D3 frontend."""

import itertools
import threading
import time
from concurrent.futures import ProcessPoolExecutor

import pandas as pd
from flask import Flask, jsonify, request
from mesa.examples.basic.schelling.model import Schelling, SchellingScenario

from sensitivity_core import run_one_simulation_kwargs

app = Flask(__name__, static_folder="static", static_url_path="")

_lock = threading.Lock()
_model: Schelling | None = None

MAX_SENSITIVITY_RUNS = 2000
SCENARIO_FIELDS = {"width", "height", "density", "minority_pc", "homophily", "radius"}


def _agent_dicts():
    agents = []
    for agent in _model.agents:
        x, y = agent.cell.coordinate
        agents.append({"x": x, "y": y, "type": agent.type, "happy": agent.happy})
    return agents


def _state():
    df = _model.datacollector.get_model_vars_dataframe().reset_index(drop=True)
    counts = {col: df[col].iloc[-1].item() for col in df.columns}
    history = {"steps": list(range(len(df)))}
    for col in df.columns:
        history[col] = [float(v) for v in df[col]]
    return {
        "step": len(df) - 1,
        "width": _model.grid.width,
        "height": _model.grid.height,
        "agents": _agent_dicts(),
        "counts": counts,
        "history": history,
        "running": _model.running,
    }


@app.route("/api/reset", methods=["POST"])
def reset():
    global _model
    params = request.get_json(silent=True) or {}
    scenario_kwargs = {k: v for k, v in params.items() if k in SCENARIO_FIELDS}
    with _lock:
        _model = Schelling(scenario=SchellingScenario(**scenario_kwargs))
        return jsonify(_state())


@app.route("/api/step", methods=["POST"])
def step():
    n = request.args.get("n", default=1, type=int)
    with _lock:
        if _model is None:
            return jsonify({"error": "Model not initialized, call /api/reset first"}), 400
        for _ in range(n):
            if not _model.running:
                break
            _model.step()
        return jsonify(_state())


@app.route("/api/state", methods=["GET"])
def state():
    with _lock:
        if _model is None:
            return jsonify({"error": "Model not initialized, call /api/reset first"}), 400
        return jsonify(_state())


def _axis_values(spec):
    lo, hi, step = float(spec["min"]), float(spec["max"]), float(spec["step"])
    values = []
    n = 0
    v = lo
    while v <= hi + 1e-9:
        values.append(round(v, 10))
        n += 1
        v = lo + n * step
    return values


def _json_metric_matrix(table):
    return [
        [None if pd.isna(value) else float(value) for value in row]
        for row in table.values.tolist()
    ]


@app.route("/api/sensitivity", methods=["POST"])
def sensitivity():
    body = request.get_json(silent=True) or {}

    fixed_params = {k: v for k, v in (body.get("fixed_params") or {}).items() if k in SCENARIO_FIELDS}
    fixed_params.pop("homophily", None)
    fixed_params.pop("minority_pc", None)

    homophily_values = _axis_values(body.get("homophily", {}))
    minority_pc_values = _axis_values(body.get("minority_pc", {}))
    replications = int(body.get("replications", 5))
    n_steps = int(body.get("steps", 200))

    total_runs = len(homophily_values) * len(minority_pc_values) * replications
    if total_runs == 0:
        return jsonify({"error": "Parameter ranges produced an empty grid"}), 400
    if total_runs > MAX_SENSITIVITY_RUNS:
        return jsonify(
            {
                "error": f"Requested {total_runs} runs, which exceeds the limit of "
                f"{MAX_SENSITIVITY_RUNS}. Reduce the grid size, replications, or steps."
            }
        ), 400

    runs = [
        {
            "homophily": h,
            "minority_pc": m,
            "replication": rep,
            "n_steps": n_steps,
            "fixed_params": fixed_params,
        }
        for h, m in itertools.product(homophily_values, minority_pc_values)
        for rep in range(replications)
    ]

    start = time.perf_counter()
    try:
        with ProcessPoolExecutor() as executor:
            results = list(executor.map(run_one_simulation_kwargs, runs))
    except Exception as exc:
        return jsonify({"error": f"Sensitivity analysis failed: {exc}"}), 500
    elapsed = time.perf_counter() - start

    df = pd.DataFrame(results)
    summary = df.groupby(["homophily", "minority_pc"]).agg(
        mean_steps_to_converge=("steps_to_converge", "mean"),
        convergence_rate=("converged", "mean"),
        mean_final_pct_happy=("final_pct_happy", "mean"),
    )

    metrics = {}
    for metric in ("mean_steps_to_converge", "convergence_rate", "mean_final_pct_happy"):
        table = summary[metric].unstack().reindex(index=homophily_values, columns=minority_pc_values)
        metrics[metric] = _json_metric_matrix(table)

    return jsonify(
        {
            "homophily_values": homophily_values,
            "minority_pc_values": minority_pc_values,
            "metrics": metrics,
            "n_runs": total_runs,
            "elapsed_seconds": round(elapsed, 1),
        }
    )


@app.route("/")
def index():
    return app.send_static_file("index.html")


if __name__ == "__main__":
    app.run(port=8001, debug=True, threaded=True, use_reloader=False)
