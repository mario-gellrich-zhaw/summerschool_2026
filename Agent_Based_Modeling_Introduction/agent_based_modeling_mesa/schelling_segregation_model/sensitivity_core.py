"""Shared simulation-run logic for sensitivity analysis, used by both the
standalone CLI script (sensitivity_analysis.py) and the web dashboard's
/api/sensitivity endpoint (server.py). Kept as a top-level, picklable
function since both callers run it via ProcessPoolExecutor.
"""

from mesa.examples.basic.schelling.model import Schelling, SchellingScenario


def run_one_simulation(homophily, minority_pc, replication, n_steps, fixed_params):
    scenario = SchellingScenario(
        homophily=homophily,
        minority_pc=minority_pc,
        **fixed_params,
    )
    model = Schelling(scenario=scenario)

    step = 0
    while step < n_steps and model.running:
        model.step()
        step += 1

    steps_to_converge = step if not model.running else None

    df = model.datacollector.get_model_vars_dataframe().reset_index(drop=True)
    final_row = df.iloc[-1]
    final_happy = int(final_row["happy"])
    population = int(final_row["population"])
    final_pct_happy = float(final_row["pct_happy"])

    return {
        "homophily": homophily,
        "minority_pc": minority_pc,
        "replication": replication,
        "steps_run": step,
        "converged": steps_to_converge is not None,
        "steps_to_converge": steps_to_converge,
        "final_happy": final_happy,
        "final_population": population,
        "final_pct_happy": final_pct_happy,
    }


def run_one_simulation_kwargs(kwargs):
    return run_one_simulation(**kwargs)
