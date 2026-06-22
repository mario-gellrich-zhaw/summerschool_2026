from __future__ import annotations

import threading

from flask import Flask, jsonify, request

from model import LifeLikeAutomaton

app = Flask(__name__, static_folder="static", static_url_path="")

_lock = threading.Lock()
_model: LifeLikeAutomaton | None = None
_history: dict[str, list[float]] = {"steps": [], "alive": [], "alive_share": []}
_step_count = 0


def _parse_model_params(params: dict) -> dict:
    return {
        "width": int(params.get("width", 36)),
        "height": int(params.get("height", 24)),
        "initial_fraction_alive": float(params.get("initial_fraction_alive", 0.24)),
        "rule": str(params.get("rule", "B3S23")),
        "seed": int(params.get("seed", 42)),
    }


def _build_model(params: dict) -> LifeLikeAutomaton:
    return LifeLikeAutomaton(
        width=params["width"],
        height=params["height"],
        initial_fraction_alive=params["initial_fraction_alive"],
        rule=params["rule"],
        seed=params["seed"],
    )


def _alive_count() -> int:
    return _model.alive_count()


def _update_current_history() -> None:
    alive = _alive_count()
    total = _model.width * _model.height
    share = (alive / total) if total else 0.0
    if not _history["steps"]:
        _history["steps"].append(0)
        _history["alive"].append(alive)
        _history["alive_share"].append(share)
        return
    _history["alive"][-1] = alive
    _history["alive_share"][-1] = share


def _append_history_point() -> None:
    alive = _alive_count()
    total = _model.width * _model.height
    _history["steps"].append(_step_count)
    _history["alive"].append(alive)
    _history["alive_share"].append((alive / total) if total else 0.0)


def _cell_payload() -> list[dict[str, int | bool]]:
    return _model.cell_payload()


def _state() -> dict:
    alive = _alive_count()
    total = _model.width * _model.height
    return {
        "step": _step_count,
        "width": _model.width,
        "height": _model.height,
        "rule": _model.rule,
        "cells": _cell_payload(),
        "summary": {
            "alive": alive,
            "dead": total - alive,
            "alive_share": (alive / total) if total else 0.0,
        },
        "history": _history,
        "running": _model.running,
    }


@app.route("/api/reset", methods=["POST"])
def reset():
    global _model, _history, _step_count
    params = request.get_json(silent=True) or {}
    with _lock:
        try:
            _model = _build_model(_parse_model_params(params))
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
        _step_count = 0
        _history = {"steps": [], "alive": [], "alive_share": []}
        _append_history_point()
        return jsonify(_state())


@app.route("/api/step", methods=["POST"])
def step():
    global _step_count
    n = request.args.get("n", default=1, type=int)
    with _lock:
        if _model is None:
            return jsonify({"error": "Model not initialized, call /api/reset first"}), 400
        for _ in range(max(1, n)):
            _model.step()
            _step_count += 1
            _append_history_point()
        return jsonify(_state())


@app.route("/api/toggle", methods=["POST"])
def toggle_cell():
    body = request.get_json(silent=True) or {}
    x = int(body.get("x", -1))
    y = int(body.get("y", -1))
    with _lock:
        if _model is None:
            return jsonify({"error": "Model not initialized, call /api/reset first"}), 400
        if not (0 <= x < _model.width and 0 <= y < _model.height):
            return jsonify({"error": "Cell coordinates out of range"}), 400
        _model.toggle_cell(x, y)
        _update_current_history()
        return jsonify(_state())


@app.route("/api/state", methods=["GET"])
def state():
    with _lock:
        if _model is None:
            return jsonify({"error": "Model not initialized, call /api/reset first"}), 400
        return jsonify(_state())


@app.route("/")
def index():
    return app.send_static_file("index.html")


if __name__ == "__main__":
    app.run(port=8004, debug=True, threaded=True, use_reloader=False)