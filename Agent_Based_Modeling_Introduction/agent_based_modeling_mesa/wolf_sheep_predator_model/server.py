"""Flask backend exposing the Mesa Wolf-Sheep model to a hand-built JS/D3 frontend."""

import itertools
import threading
import time
from concurrent.futures import ProcessPoolExecutor

import pandas as pd
from flask import Flask, jsonify, request
from mesa.examples.advanced.wolf_sheep.agents import GrassPatch, Sheep, Wolf
from mesa.examples.advanced.wolf_sheep.model import WolfSheep, WolfSheepScenario

from sensitivity_core import run_one_simulation_kwargs

app = Flask(__name__, static_folder="static", static_url_path="")

MAX_SENSITIVITY_RUNS = 2000
SCENARIO_FIELDS = {
    "width",
    "height",
    "initial_sheep",
    "initial_wolves",
    "sheep_reproduce",
    "wolf_reproduce",
    "wolf_gain_from_food",
    "grass",
    "grass_regrowth_time",
    "sheep_gain_from_food",
}

_lock = threading.Lock()
_model: WolfSheep | None = None


def _agent_dicts():
    agents = []
    for wolf in _model.agents_by_type[Wolf]:
        x, y = wolf.cell.coordinate
        agents.append({"type": "wolf", "x": x, "y": y, "fully_grown": None})
    for sheep in _model.agents_by_type[Sheep]:
        x, y = sheep.cell.coordinate
        agents.append({"type": "sheep", "x": x, "y": y, "fully_grown": None})
    if GrassPatch in _model.agents_by_type:
        for grass in _model.agents_by_type[GrassPatch]:
            x, y = grass.cell.coordinate
            agents.append(
                {"type": "grass", "x": x, "y": y, "fully_grown": grass.fully_grown}
            )
    return agents


def _state():
    df = _model.datacollector.get_model_vars_dataframe().reset_index(drop=True)
    counts = {col: int(df[col].iloc[-1]) for col in df.columns}
    history = {"steps": list(range(len(df)))}
    for col in df.columns:
        history[col] = [int(v) for v in df[col]]
    return {
        "step": len(df) - 1,
        "width": _model.width,
        "height": _model.height,
        "agents": _agent_dicts(),
        "counts": counts,
        "history": history,
    }


@app.route("/api/reset", methods=["POST"])
def reset():
    global _model
    params = request.get_json(silent=True) or {}
    scenario_kwargs = {k: v for k, v in params.items() if k in SCENARIO_FIELDS}
    with _lock:
        _model = WolfSheep(scenario=WolfSheepScenario(**scenario_kwargs))
        return jsonify(_state())


@app.route("/api/step", methods=["POST"])
def step():
    n = request.args.get("n", default=1, type=int)
    with _lock:
        if _model is None:
            return jsonify({"error": "Model not initialized, call /api/reset first"}), 400
        for _ in range(n):
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


@app.route("/api/sensitivity", methods=["POST"])
def sensitivity():
    body = request.get_json(silent=True) or {}

    fixed_params = {k: v for k, v in (body.get("fixed_params") or {}).items() if k in SCENARIO_FIELDS}
    fixed_params.pop("initial_sheep", None)
    fixed_params.pop("initial_wolves", None)

    sheep_values = [int(v) for v in _axis_values(body.get("initial_sheep", {}))]
    wolf_values = [int(v) for v in _axis_values(body.get("initial_wolves", {}))]
    replications = int(body.get("replications", 5))
    n_steps = int(body.get("steps", 100))

    total_runs = len(sheep_values) * len(wolf_values) * replications
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
            "initial_sheep": s,
            "initial_wolves": w,
            "replication": rep,
            "n_steps": n_steps,
            "fixed_params": fixed_params,
        }
        for s, w in itertools.product(sheep_values, wolf_values)
        for rep in range(replications)
    ]

    start = time.perf_counter()
    with ProcessPoolExecutor() as executor:
        results = list(executor.map(run_one_simulation_kwargs, runs))
    elapsed = time.perf_counter() - start

    df = pd.DataFrame(results)
    agg_kwargs = {
        "mean_final_wolves": ("final_wolves", "mean"),
        "mean_final_sheep": ("final_sheep", "mean"),
        "wolves_extinct_rate": ("wolves_extinct", "mean"),
        "sheep_extinct_rate": ("sheep_extinct", "mean"),
    }
    if df["final_grass"].notna().any():
        agg_kwargs["mean_final_grass"] = ("final_grass", "mean")
        agg_kwargs["grass_extinct_rate"] = ("grass_extinct", "mean")

    summary = df.groupby(["initial_sheep", "initial_wolves"]).agg(**agg_kwargs)

    metrics = {}
    for metric in agg_kwargs:
        table = summary[metric].unstack().reindex(index=sheep_values, columns=wolf_values)
        metrics[metric] = table.values.tolist()

    return jsonify(
        {
            "initial_sheep_values": sheep_values,
            "initial_wolves_values": wolf_values,
            "metrics": metrics,
            "n_runs": total_runs,
            "elapsed_seconds": round(elapsed, 1),
        }
    )


@app.route("/")
def index():
    return app.send_static_file("index.html")


if __name__ == "__main__":
    app.run(port=8000, debug=True, threaded=True)
