"""Shared sensitivity-analysis worker for the Boltzmann wealth model."""

from mesa.examples.basic.boltzmann_wealth_model.model import BoltzmannScenario, BoltzmannWealth


def _top_wealth_share(wealth_values):
    if not wealth_values:
        return 0.0
    total_wealth = sum(wealth_values)
    if total_wealth == 0:
        return 0.0
    top_count = max(1, int(round(len(wealth_values) * 0.1)))
    richest = sorted(wealth_values, reverse=True)[:top_count]
    return sum(richest) / total_wealth


def _zero_wealth_share(wealth_values):
    if not wealth_values:
        return 0.0
    return sum(1 for value in wealth_values if value == 0) / len(wealth_values)


def run_one_simulation(n, n_steps, replication, fixed_params):
    base_seed = int(fixed_params.get("seed", 42))
    scenario = BoltzmannScenario(
        n=int(n),
        width=int(fixed_params.get("width", 20)),
        height=int(fixed_params.get("height", 20)),
        rng=base_seed + int(replication),
    )
    model = BoltzmannWealth(scenario=scenario)

    for _ in range(int(n_steps)):
        model.step()

    wealth_values = [int(agent.wealth) for agent in model.agents]
    history_df = model.datacollector.get_model_vars_dataframe().reset_index(drop=True)

    return {
        "n": int(n),
        "n_steps": int(n_steps),
        "replication": int(replication),
        "final_gini": float(history_df["Gini"].iloc[-1]),
        "top10_wealth_share": _top_wealth_share(wealth_values),
        "zero_wealth_share": _zero_wealth_share(wealth_values),
        "richest_wealth": max(wealth_values) if wealth_values else 0,
    }


def run_one_simulation_kwargs(kwargs):
    return run_one_simulation(**kwargs)