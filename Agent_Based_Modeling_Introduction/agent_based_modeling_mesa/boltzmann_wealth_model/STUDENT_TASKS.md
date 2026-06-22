# Student Tasks: Build a Boltzmann Wealth Model Web App

Folder: `Agent_Based_Modeling_Introduction/agent_based_modeling_mesa/boltzmann_wealth_model/`

## Goal

Build your own interactive web app for the Boltzmann wealth model. You may choose your own software stack, programming language, UI framework, and plotting library. The core simulation logic, however, must match the original model idea: agents move through a grid, interact locally, exchange wealth, and generate an unequal wealth distribution over time.

## Allowed Software Choices

You may choose any reasonable setup, for example:

- Python with Flask, FastAPI, Streamlit, Solara, Dash, or Panel
- JavaScript or TypeScript with a frontend framework and a backend of your choice
- A notebook-to-app workflow if you later package it as a real interactive app
- Any plotting or visualization library such as D3, Plotly, Vega-Lite, Altair, Matplotlib, or similar

Your grade should not depend on one specific framework. It depends on whether the model logic, the simulation behavior, and the app functionality are correct and well explained.

## Required Model Logic

Your implementation must include the following model components:

1. A population of agents with an individual wealth value.
2. A two-dimensional grid or neighborhood space in which agents are located.
3. Random movement of agents between neighboring cells.
4. Local interaction: an agent can only transfer wealth when another agent is present in the same location or neighborhood, depending on your chosen implementation.
5. A wealth-transfer rule consistent with the Boltzmann wealth model idea: agents with positive wealth can give one unit of wealth to another agent.
6. Repeated simulation steps so that the wealth distribution evolves over time.
7. A correct computation of the Gini coefficient during the simulation.
8. A way to inspect the distribution of wealth across agents.

## Required App Features

Your web app must allow a user to do the following:

1. Start or reset the model with user-defined parameters.
2. Step the model forward once.
3. Run the model continuously as an animation or repeated simulation loop.
4. Pause or stop the simulation.
5. Display the agents in the grid or space.
6. Show at least one inequality metric over time, including the Gini coefficient.
7. Show the current wealth distribution, for example as a histogram, bar chart, or ordered list.
8. Show the current simulation step.
9. Let the user change key parameters before a run.
10. Include a sensitivity analysis that compares how outcomes change when important model parameters are varied.

## Required Sensitivity Analysis

Your project must include a sensitivity analysis in addition to the main simulation app.

At minimum, the sensitivity analysis must:

1. Vary at least two meaningful model parameters, such as the number of agents, grid width, grid height, or number of simulation steps.
2. Run multiple simulations for each parameter combination.
3. Report at least one inequality outcome, including the Gini coefficient.
4. Present the results clearly, for example as a heatmap, table, chart, or downloadable results file.
5. Be connected to the web app directly or be clearly documented as a companion analysis workflow.

## Minimum Parameters

At minimum, your app must expose:

1. Number of agents
2. Grid width
3. Grid height
4. Random seed or another reproducibility control
5. Simulation speed or play interval
6. Optional maximum number of steps

You may add further parameters if you can justify them.

## Recommended Development Steps

Follow these steps when building the app:

1. Read the notebook and understand the original model logic before writing UI code.
2. Implement the simulation model first without any interface.
3. Create a small test run in code to verify agent movement and wealth transfer.
4. Implement the Gini coefficient and verify that it changes over time.
5. Add a simple visualization of the agents on the grid.
6. Add controls for reset, step, run, and pause.
7. Add a time-series chart for Gini.
8. Add a wealth-distribution view.
9. Add parameter inputs and validate them.
10. Implement a sensitivity analysis workflow and verify that the reported outcomes are plausible.
11. Improve the design and usability only after the simulation logic works correctly.

## What To Demonstrate

Your final submission should make it clear that the following behaviors are present:

1. Agents actually move.
2. Agents only exchange wealth through local encounters.
3. Total wealth is conserved unless you explicitly introduce and justify a model extension.
4. Inequality emerges from repeated local exchanges.
5. The Gini coefficient reacts to the changing wealth distribution.
6. The sensitivity analysis shows how selected parameters influence inequality or wealth concentration outcomes.

## Suggested Validation Checks

Before submitting, check the following:

1. If all agents start with equal wealth, the Gini coefficient should begin close to 0.
2. Over time, wealth should become unevenly distributed.
3. Some agents may end with little or no wealth, while a small number accumulate more.
4. Changing the number of agents or grid size should affect encounter frequency and therefore the dynamics.
5. Resetting the app should create a clean new run.
6. Repeated runs in the sensitivity analysis should produce interpretable differences across parameter settings.

## Possible Extensions

If the required version works, you may extend it with:

- different neighborhood definitions
- additional charts or summary statistics
- export of simulation results
- alternative UI layouts or richer design

Extensions are only valuable if the core model is already correct.

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
