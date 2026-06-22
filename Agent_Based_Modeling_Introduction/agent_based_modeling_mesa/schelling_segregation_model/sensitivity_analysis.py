"""Sensitivity analysis for the Schelling segregation model via a
full-factorial parameter sweep.

Runs every combination of HOMOPHILY_VALUES x MINORITY_PC_VALUES for
N_REPLICATIONS random seeds each (Monte Carlo replications), in parallel
across CPU cores. No web app, no UI -- just a CSV of results plus a console
summary table.
"""

import itertools
from concurrent.futures import ProcessPoolExecutor, as_completed

import pandas as pd
from tqdm import tqdm

from sensitivity_core import run_one_simulation_kwargs

HOMOPHILY_VALUES = [0.1, 0.3, 0.5, 0.7, 0.9]
MINORITY_PC_VALUES = [0.1, 0.2, 0.3, 0.4, 0.5]
N_REPLICATIONS = 5
N_STEPS = 200  # cap, in case a combination never converges
N_WORKERS = None  # None -> use all available CPU cores
OUTPUT_CSV = "sensitivity_analysis_results.csv"

# Fixed scenario parameters, held constant while homophily/minority_pc are swept.
FIXED_PARAMS = {
    "width": 20,
    "height": 20,
    "density": 0.9,
    "radius": 1,
}


def main():
    runs = [
        {
            "homophily": h,
            "minority_pc": m,
            "replication": rep,
            "n_steps": N_STEPS,
            "fixed_params": FIXED_PARAMS,
        }
        for h, m in itertools.product(HOMOPHILY_VALUES, MINORITY_PC_VALUES)
        for rep in range(N_REPLICATIONS)
    ]

    results = []
    with ProcessPoolExecutor(max_workers=N_WORKERS) as executor:
        futures = [executor.submit(run_one_simulation_kwargs, run) for run in runs]
        for future in tqdm(as_completed(futures), total=len(futures), desc="Sensitivity analysis"):
            results.append(future.result())

    df = pd.DataFrame(results)
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"\nSaved {len(df)} runs to {OUTPUT_CSV}")

    summary = df.groupby(["homophily", "minority_pc"]).agg(
        mean_steps_to_converge=("steps_to_converge", "mean"),
        convergence_rate=("converged", "mean"),
        mean_final_pct_happy=("final_pct_happy", "mean"),
    )
    pd.set_option("display.width", 120)
    print("\nMean steps to converge, by homophily (rows) x minority_pc (cols):")
    print(summary["mean_steps_to_converge"].unstack().round(1))
    print("\nConvergence rate, by homophily (rows) x minority_pc (cols):")
    print(summary["convergence_rate"].unstack().round(2))
    print("\nMean final % happy, by homophily (rows) x minority_pc (cols):")
    print(summary["mean_final_pct_happy"].unstack().round(1))


if __name__ == "__main__":
    main()
