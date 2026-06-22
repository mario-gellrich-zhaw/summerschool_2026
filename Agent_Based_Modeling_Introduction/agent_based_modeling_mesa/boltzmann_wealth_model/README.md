# Boltzmann Wealth Model

Folder: `Agent_Based_Modeling_Introduction/agent_based_modeling_mesa/boltzmann_wealth_model/`

## Summary

This dashboard wraps Mesa's Boltzmann wealth-exchange model in a Flask plus D3 web app. Agents wander on a grid and hand over one unit of wealth when they meet another agent in the same cell. Starting from equal wealth, repeated random exchanges generate inequality over time. The app exposes the live grid, Gini history, a current wealth histogram, and a sensitivity-analysis heatmap.

## How to Run

From this folder, run:

```bash
python server.py
```

Then open http://localhost:8003/ in a browser.

## Adjustable Parameters

The sidebar lets you change:

| Parameter | Default | Meaning |
|---|---:|---|
| Number of Agents | 80 | How many agents move and exchange wealth. |
| Grid Width / Height | 20 / 20 | Size of the movement space. Smaller grids force more encounters. |
| Random Seed | 42 | Reproducible random initialization. |
| Max Steps | 0 | Optional step cap; `0` means no limit. |
| Play Interval | 160 ms | Animation speed while the simulation is running. |

## Sensitivity Analysis

The dashboard includes a full-factorial sensitivity analysis over agent count and simulation steps. For every combination, several Monte Carlo replications run in parallel and the heatmap can switch between:

* mean final Gini
* mean top-10% wealth share
* mean zero-wealth share
* mean richest-agent wealth

The standalone CLI script uses the same worker function:

```bash
python sensitivity_analysis.py
```

This saves `sensitivity_analysis_results.csv` in the folder and prints pivot tables in the terminal.

## Files

* `server.py`: Flask backend and dashboard API.
* `README.md`: folder-level documentation for this app.
* `static/`: D3 frontend assets.
* `sensitivity_core.py`: shared worker used by both the dashboard and CLI sweep.
* `sensitivity_analysis.py`: standalone batch analysis.

## Further Reading

Mesa example documentation:
https://mesa.readthedocs.io/latest/examples/basic/boltzmann_wealth_model.html