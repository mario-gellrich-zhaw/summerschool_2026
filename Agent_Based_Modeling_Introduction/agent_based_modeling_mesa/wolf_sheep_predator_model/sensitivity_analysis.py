"""Sensitivity analysis for the Wolf-Sheep model via a full-factorial parameter sweep.

Runs every combination of INITIAL_SHEEP_VALUES x INITIAL_WOLVES_VALUES for
N_REPLICATIONS random seeds each (Monte Carlo replications), in parallel
across CPU cores. No web app, no UI -- just a CSV of results plus a console
summary table.
"""

import itertools
from concurrent.futures import ProcessPoolExecutor, as_completed

import pandas as pd
from tqdm import tqdm

from sensitivity_core import run_one_simulation_kwargs

INITIAL_SHEEP_VALUES = [50, 75, 100, 125, 150, 200]
INITIAL_WOLVES_VALUES = [5, 10, 15, 20, 25]
N_REPLICATIONS = 5
N_STEPS = 100
N_WORKERS = None  # None -> use all available CPU cores
OUTPUT_CSV = "sensitivity_analysis_results.csv"

# Fixed scenario parameters, held constant while initial sheep/wolf
# population sizes are swept. These match the dashboard's defaults
# (static/index.html), which give a balanced starting ecosystem.
FIXED_PARAMS = {
    "width": 20,
    "height": 20,
    "sheep_reproduce": 0.04,
    "wolf_reproduce": 0.05,
    "wolf_gain_from_food": 20,
    "sheep_gain_from_food": 4,
    "grass_regrowth_time": 20,
    "grass": True,
}


def main():
    runs = [
        {
            "initial_sheep": s,
            "initial_wolves": w,
            "replication": rep,
            "n_steps": N_STEPS,
            "fixed_params": FIXED_PARAMS,
        }
        for s, w in itertools.product(INITIAL_SHEEP_VALUES, INITIAL_WOLVES_VALUES)
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
    pd.set_option("display.width", 120)
    print("\nMean final wolves, by initial_sheep (rows) x initial_wolves (cols):")
    print(summary["mean_final_wolves"].unstack().round(1))
    print("\nMean final sheep, by initial_sheep (rows) x initial_wolves (cols):")
    print(summary["mean_final_sheep"].unstack().round(1))
    print("\nWolf extinction rate, by initial_sheep (rows) x initial_wolves (cols):")
    print(summary["wolves_extinct_rate"].unstack().round(2))
    print("\nSheep extinction rate, by initial_sheep (rows) x initial_wolves (cols):")
    print(summary["sheep_extinct_rate"].unstack().round(2))
    if "mean_final_grass" in agg_kwargs:
        print("\nMean final grass patches, by initial_sheep (rows) x initial_wolves (cols):")
        print(summary["mean_final_grass"].unstack().round(1))
        print("\nGrass extinction rate, by initial_sheep (rows) x initial_wolves (cols):")
        print(summary["grass_extinct_rate"].unstack().round(2))


if __name__ == "__main__":
    main()
