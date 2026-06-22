# Wolf-Sheep Predation Model

## Summary

A simple ecological model, consisting of three agent types: wolves, sheep, and grass. The wolves and the sheep wander around the grid at random. Wolves and sheep both expend energy moving around, and replenish it by eating. Sheep eat grass, and wolves eat sheep if they end up on the same grid cell.

If wolves and sheep have enough energy, they reproduce, creating a new wolf or sheep (in this simplified model, only one parent is needed for reproduction). The grass on each cell regrows at a constant rate. If any wolves and sheep run out of energy, they die.

The model is tests and demonstrates several Mesa concepts and features:
 - MultiGrid
 - Multiple agent types (wolves, sheep, grass)
 - Overlay arbitrary text (wolf's energy) on agent's shapes while drawing on CanvasGrid
 - Agents inheriting a behavior (random movement) from an abstract parent
 - Writing a model composed of multiple files.
 - Dynamically adding and removing agents from the schedule

## How to Run

The model and agent classes themselves come from the installed `mesa` package, `mesa.examples.advanced.wolf_sheep`, and are not duplicated here.

```
    $ python server.py
```
Then open http://localhost:8000/ in a browser.

## Model Parameters

These are the parameters adjustable from the dashboard sidebar (defaults shown match `static/index.html`):

| Parameter | Default | Meaning |
|---|---|---|
| Grid Width / Height | 20 / 20 | Size of the (torus) grid the agents move on. |
| Initial Sheep | 100 | Number of sheep created at the start of the run. |
| Initial Wolves | 10 | Number of wolves created at the start of the run. |
| Sheep Reproduction Rate | 0.04 | Probability that a sheep reproduces (asexually) at each step it survives. |
| Wolf Reproduction Rate | 0.05 | Probability that a wolf reproduces (asexually) at each step it survives. |
| Wolf Gain From Food | 20 | Energy a wolf gains from eating a sheep. |
| Sheep Gain From Food | 4 | Energy a sheep gains from eating fully-grown grass (only applies if grass regrowth is enabled). |
| Grass Regrowth Time | 20 | Number of steps it takes an eaten grass patch to become fully grown again. |
| Grass regrowth enabled? | on | If off, sheep don't need to eat grass for energy (grass patches aren't simulated). |

Every step, each animal moves one cell, loses 1 energy, tries to feed (wolves eat a sheep on their cell; sheep eat fully-grown grass on their cell), dies if its energy drops below 0, and otherwise reproduces with the probability above. These rules come straight from `Animal.step()`/`Sheep.feed()`/`Wolf.feed()` in `mesa.examples.advanced.wolf_sheep.agents`.

## Sensitivity Analysis

The dashboard's "Sensitivity Analysis" card runs a full-factorial parameter sweep of Initial Sheep x Initial Wolves population sizes directly in the browser: set min/max/step for each axis plus the number of replications and steps, click **Run Sensitivity Analysis**, and a heatmap renders once the (parallel) sweep finishes. Switch the metric dropdown (mean final wolves/sheep/grass, wolf/sheep/grass extinction rate) to re-render instantly from the same results, no re-run needed. Extinction rate here means the fraction of runs in which the population reached zero at any point during the simulation, not only at the final step.

There's also a standalone, no-UI version for quicker/bigger sweeps from the terminal:
```
    $ python sensitivity_analysis.py
```
This prints console pivot tables and saves `sensitivity_analysis_results.csv`. Both the dashboard endpoint and the script share the same simulation-run logic (`sensitivity_core.py`).

## Files

* ``server.py``: Flask backend for the dashboard, exposing `/api/reset`, `/api/step`, `/api/state`, `/api/sensitivity`.
* ``static/``: hand-built JS/D3 frontend (`index.html`, `app.js`, `style.css`) served by `server.py`.
* ``sensitivity_core.py``: shared per-run simulation logic used by both `server.py` and `sensitivity_analysis.py`.
* ``sensitivity_analysis.py``: standalone CLI parameter sweep (see Sensitivity Analysis above).

## Further Reading

This example is based on Mesa's own Wolf-Sheep Predation example:
https://mesa.readthedocs.io/stable/examples/advanced/wolf_sheep.html

which is in turn closely based on the NetLogo Wolf-Sheep Predation Model:

Wilensky, U. (1997). NetLogo Wolf Sheep Predation model. http://ccl.northwestern.edu/netlogo/models/WolfSheepPredation. Center for Connected Learning and Computer-Based Modeling, Northwestern University, Evanston, IL.

See also the [Lotka–Volterra equations
](https://en.wikipedia.org/wiki/Lotka%E2%80%93Volterra_equations) for an example of a classic differential-equation model with similar dynamics.
