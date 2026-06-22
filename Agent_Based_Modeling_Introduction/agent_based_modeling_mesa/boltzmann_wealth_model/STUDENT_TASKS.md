# Student Tasks: Build a Boltzmann Wealth Model Web App

Folder: `Agent_Based_Modeling_Introduction/agent_based_modeling_mesa/boltzmann_wealth_model/`

## Goal

Build your own interactive web app for the Boltzmann wealth model. The core idea: agents move around, interact locally, and exchange wealth, producing an unequal wealth distribution over time. Beyond that, the design is yours.

Use the original sources below for the model details and background — they contain what you need.

## Your Freedom

- Pick any language, framework, and plotting/visualization library you like.
- Decide how agents move, interact, and exchange wealth, as long as it stays true to the Boltzmann wealth model idea (local interaction, random movement, simple wealth transfer).
- Decide which parameters to expose, how the UI looks, and how you present results.
- Interpret "grid" loosely if you have a good reason (e.g. a network or continuous space) — just be able to explain your choice.

You'll be graded on whether the model logic is correct, the app works, and you can explain and justify the decisions you made — not on following a specific recipe.

## Gini Coefficient

The Gini coefficient measures inequality on a scale from 0 (everyone has equal wealth) to close to 1 (one agent holds almost everything). The same formula used in the Mesa example is:

$$G = 1 + \frac{1}{N} - \frac{2}{N \sum_{i=1}^{N} x_i} \sum_{i=1}^{N} (N + 1 - i)\, x_i$$

where $x_1 \le x_2 \le \dots \le x_N$ are the agents' wealth values sorted in ascending order, and $N$ is the number of agents. You're free to compute it however is convenient in your stack, as long as it's mathematically equivalent.

## What Your App Should Be Able to Do

Roughly, a user should be able to configure the model, run/step/pause/reset the simulation, see the agents and the resulting wealth distribution, and track inequality (e.g. the Gini coefficient) over time. How you implement and present this is up to you.

The three images below are quick illustrations (generated from a minimal toy simulation, not a reference solution) of the kind of views your app could include — feel free to design these completely differently.

| Agents on the grid | Wealth distribution | Inequality over time |
| --- | --- | --- |
| ![Agents on the grid, dot size/color encodes wealth](images/grid_view.png) | ![Histogram of wealth across agents](images/wealth_histogram.png) | ![Gini coefficient rising over simulation steps](images/gini_over_time.png) |

## Sensitivity Analysis

Include some analysis of how outcomes change when you vary model parameters (e.g. number of agents, grid size, number of steps), and report at least one inequality measure. Form is your choice: heatmap, table, chart, notebook, or a panel inside the app.

## Suggested (Not Required) Approach

If you want a starting structure: build the simulation first without a UI, check that agents move and exchange wealth sensibly, add the Gini coefficient, then layer on visualization and controls, and finally the sensitivity analysis. Feel free to deviate if you have a better workflow.

## Sanity Checks Worth Doing

A few things worth confirming before you call it done: wealth starts equal and inequality should emerge over time rather than being equal throughout; a reset should give you a clean run; changing population or grid size should visibly affect the dynamics.

## Original Sources

Mesa example documentation:
https://mesa.readthedocs.io/latest/examples/basic/boltzmann_wealth_model.html

Original econophysics paper:
Adrian Dragulescu and Victor M. Yakovenko, Statistical mechanics of money.
ArXiv: https://arxiv.org/abs/cond-mat/0001432
Journal version: https://doi.org/10.1007/s100510070114

Additional background referenced by the Mesa example:
Adrian A. Dragulescu and Victor M. Yakovenko, Statistical Mechanics of Money, Income, and Wealth: A Short Survey.
ArXiv: https://arxiv.org/abs/cond-mat/0211175
PDF: https://arxiv.org/pdf/cond-mat/0211175
