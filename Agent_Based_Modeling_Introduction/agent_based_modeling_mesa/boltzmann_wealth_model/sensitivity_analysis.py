"""Standalone sensitivity analysis for the Boltzmann wealth model."""

import itertools
from concurrent.futures import ProcessPoolExecutor, as_completed

import pandas as pd
from tqdm import tqdm

from sensitivity_core import run_one_simulation_kwargs

AGENT_COUNT_VALUES = [40, 80, 120, 160]
STEP_VALUES = [25, 50, 100, 200]
N_REPLICATIONS = 5
N_WORKERS = None
OUTPUT_CSV = "sensitivity_analysis_results.csv"

FIXED_PARAMS = {
    "width": 20,
    "height": 20,
    "seed": 42,
}


def main():
    runs = [
        {
            "n": agent_count,
            "n_steps": steps,
            "replication": replication,
            "fixed_params": FIXED_PARAMS,
        }
        for agent_count, steps in itertools.product(AGENT_COUNT_VALUES, STEP_VALUES)
        for replication in range(N_REPLICATIONS)
    ]

    results = []
    with ProcessPoolExecutor(max_workers=N_WORKERS) as executor:
        futures = [executor.submit(run_one_simulation_kwargs, run) for run in runs]
        for future in tqdm(as_completed(futures), total=len(futures), desc="Sensitivity analysis"):
            results.append(future.result())

    df = pd.DataFrame(results)
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"\nSaved {len(df)} runs to {OUTPUT_CSV}")

    summary = df.groupby(["n", "n_steps"]).agg(
        mean_final_gini=("final_gini", "mean"),
        mean_top10_wealth_share=("top10_wealth_share", "mean"),
        mean_zero_wealth_share=("zero_wealth_share", "mean"),
        mean_richest_wealth=("richest_wealth", "mean"),
    )
    pd.set_option("display.width", 120)
    print("\nMean final Gini, by agent count (rows) x steps (cols):")
    print(summary["mean_final_gini"].unstack().round(3))
    print("\nMean top-10% wealth share, by agent count (rows) x steps (cols):")
    print(summary["mean_top10_wealth_share"].unstack().round(3))
    print("\nMean zero-wealth share, by agent count (rows) x steps (cols):")
    print(summary["mean_zero_wealth_share"].unstack().round(3))
    print("\nMean richest-agent wealth, by agent count (rows) x steps (cols):")
    print(summary["mean_richest_wealth"].unstack().round(1))


if __name__ == "__main__":
    main()