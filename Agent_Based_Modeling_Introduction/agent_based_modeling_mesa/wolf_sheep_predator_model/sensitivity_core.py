"""Shared simulation-run logic for sensitivity analysis, used by both the
standalone CLI script (sensitivity_analysis.py) and the web dashboard's
/api/sensitivity endpoint (server.py). Kept as a top-level, picklable
function since both callers run it via ProcessPoolExecutor.
"""

from mesa.examples.advanced.wolf_sheep.agents import Sheep, Wolf
from mesa.examples.advanced.wolf_sheep.model import WolfSheep, WolfSheepScenario


def _first_zero_step(series):
    zero_idx = series[series == 0].index
    return int(zero_idx[0]) if len(zero_idx) > 0 else None


def _extinction_stats(series):
    zero_step = _first_zero_step(series)
    return zero_step is not None, zero_step


def run_one_simulation(initial_sheep, initial_wolves, replication, n_steps, fixed_params):
    scenario = WolfSheepScenario(
        initial_sheep=initial_sheep,
        initial_wolves=initial_wolves,
        **fixed_params,
    )
    model = WolfSheep(scenario=scenario)

    for _ in range(n_steps):
        if len(model.agents_by_type[Wolf]) == 0 and len(model.agents_by_type[Sheep]) == 0:
            break
        model.step()

    df = model.datacollector.get_model_vars_dataframe().reset_index(drop=True)
    wolves = df["Wolves"]
    sheep = df["Sheep"]
    grass = df["Grass"] if "Grass" in df.columns else None
    wolves_extinct, wolves_extinct_step = _extinction_stats(wolves)
    sheep_extinct, sheep_extinct_step = _extinction_stats(sheep)

    result = {
        "initial_sheep": initial_sheep,
        "initial_wolves": initial_wolves,
        "replication": replication,
        "steps_run": len(df) - 1,
        "final_wolves": int(wolves.iloc[-1]),
        "final_sheep": int(sheep.iloc[-1]),
        "peak_wolves": int(wolves.max()),
        "peak_sheep": int(sheep.max()),
        "wolves_extinct": wolves_extinct,
        "wolves_extinct_step": wolves_extinct_step,
        "sheep_extinct": sheep_extinct,
        "sheep_extinct_step": sheep_extinct_step,
    }

    if grass is not None:
        grass_extinct, grass_extinct_step = _extinction_stats(grass)
        result["final_grass"] = int(grass.iloc[-1])
        result["peak_grass"] = int(grass.max())
        result["grass_extinct"] = grass_extinct
        result["grass_extinct_step"] = grass_extinct_step
    else:
        result["final_grass"] = None
        result["peak_grass"] = None
        result["grass_extinct"] = None
        result["grass_extinct_step"] = None

    return result


def run_one_simulation_kwargs(kwargs):
    return run_one_simulation(**kwargs)
