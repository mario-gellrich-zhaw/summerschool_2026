# Schelling Segregation Model

Folder: `Agent_Based_Modeling_Introduction/agent_based_modeling_mesa/schelling_segregation_model/`

## Summary

A model of residential segregation, consisting of agents of two types (type 0 and type 1, a minority/majority split) living on a grid. Each agent is "happy" if at least a `homophily` fraction of its neighbors (within `radius`) share its type. Unhappy agents move to a random empty cell. The model demonstrates Thomas Schelling's famous result: even a mild preference for similar neighbors can produce far more segregation than anyone individually intends.

The model stops itself once every agent is happy (`model.running` becomes `False`) — for some parameter combinations (e.g. very high homophily) it may never converge.

## How to Run

The model and agent classes themselves come from the installed `mesa` package, `mesa.examples.basic.schelling`, and are not duplicated here.

From this folder, run:

```
    $ python server.py
```
Then open http://localhost:8001/ in a browser.

## Model Parameters

These are the parameters adjustable from the dashboard sidebar (defaults shown match `static/index.html`):

| Parameter | Default | Meaning |
|---|---|---|
| Grid Width / Height | 20 / 20 | Size of the grid agents live on (one agent per cell, at most). |
| Agent Density | 0.9 | Probability that any given cell starts out occupied. |
| Fraction Minority | 0.5 | Probability that an occupied cell's agent is type 1 (minority) rather than type 0. |
| Homophily | 0.7 | Minimum fraction of same-type neighbors (within `radius`) an agent needs to be happy. |
| Search Radius | 1 | How many cells out to look when counting neighbors (1 = the 8 surrounding cells). |

Every step, all unhappy agents from the previous step move to a random empty cell, then every agent's happiness is reassessed. The model stops once everyone is happy. These rules come straight from `SchellingAgent.assign_state()`/`step()` in `mesa.examples.basic.schelling.agents`.

## Sensitivity Analysis

The dashboard's "Sensitivity Analysis" card runs a full-factorial parameter sweep of Homophily x Fraction Minority directly in the browser: set min/max/step for each axis plus the number of replications and max steps, click **Run Sensitivity Analysis**, and a heatmap renders once the (parallel) sweep finishes. Switch the metric dropdown (mean steps to converge, convergence rate, mean final % happy) to re-render instantly from the same results, no re-run needed. Cells where no replication converged within the step cap show as "N/A".

There's also a standalone, no-UI version for quicker/bigger sweeps from the terminal:
```
    $ python sensitivity_analysis.py
```
This prints console pivot tables and saves `sensitivity_analysis_results.csv`. Both the dashboard endpoint and the script share the same simulation-run logic (`sensitivity_core.py`).

Homophily and Fraction Minority were chosen as the sweep axes because they're the two parameters the model's own description calls out as driving the segregation effect — e.g. the sweep clearly shows convergence rate collapsing to 0% once homophily gets high enough that agents can essentially never be satisfied.

## Files

* ``server.py``: Flask backend for the dashboard, exposing `/api/reset`, `/api/step`, `/api/state`, `/api/sensitivity`.
* ``README.md``: folder-level documentation for this app.
* ``static/``: hand-built JS/D3 frontend (`index.html`, `app.js`, `style.css`) served by `server.py`.
* ``sensitivity_core.py``: shared per-run simulation logic used by both `server.py` and `sensitivity_analysis.py`.
* ``sensitivity_analysis.py``: standalone CLI parameter sweep (see Sensitivity Analysis above).

## Further Reading

This example is based on Mesa's own Schelling Segregation example:
https://mesa.readthedocs.io/latest/examples/basic/schelling.html

which is in turn based on the classic model:

Schelling, T. C. (1971). Dynamic models of segregation. *Journal of Mathematical Sociology*, 1(2), 143-186.
