
# Summer School 2026: Data Science and FinTech

Data science combines computational, statistical, and algorithmic methods to analyze data and generate insights. In this course, these methods are explored through the materials in this repository, with a particular focus on Python, agent-based modeling, simulation analysis, credit risk, and interactive web applications for teaching and experimentation.

## Course Focus

The materials in this repository support two main themes:

- developing practical Python skills for scientific programming and data analysis
- building and analyzing agent-based models
- understanding credit risk through simulation
- exploring emergent behavior in wealth distribution, segregation, predator-prey systems, and cellular automata
- deploying models as browser-based teaching applications

## Repository Structure

### `Agent_Based_Credit_Risk_Modeling/`

Materials for the credit-risk module.

- `agent_based_model_credit_risk.ipynb`: notebook version of the credit-risk model
- `web_app/`: extracted Flask-based dashboard for interactive simulation and sensitivity analysis
   - `model.py`: credit-risk model logic
   - `server.py`: Flask backend
   - `sensitivity_core.py`: shared one-run sensitivity logic
   - `sensitivity_analysis.py`: standalone sweep script
   - `static/`: HTML, CSS, and JavaScript frontend

### `Agent_Based_Modeling_Introduction/`

Introductory materials for agent-based modeling in Python.

- `agent_based_modeling_boltzmann_wealth_model.ipynb`: notebook introduction to wealth distribution dynamics
- `agent_based_modeling_agentpy/`: agent-based modeling examples using AgentPy
- `agent_based_modeling_mesa/`: interactive Mesa-based examples
   - `wolf_sheep_predator_model/`
   - `schelling_segregation_model/`
   - `boltzmann_wealth_model/`
- `cellular_automata/`: interactive web app for Life-like cellular automata (Conway's Game of Life and related rules)
   - `model.py`: custom Life-like automaton logic with configurable rules
   - `server.py`: Flask backend
   - `static/`: D3 frontend assets
- `Slides_Agent_Based_Credit_Risk_Modeling_Workshop.pptx`
- `Slides_Cellular_Automata_Agent_Based_Modeling.pptx`

### Root-level Files

- `requirements.txt`: Python dependencies for the course materials and apps
- `.devcontainer/devcontainer.json`: Codespaces/devcontainer setup
- `Syllabus-Summer-2026_DataScience_Fintech_GELL.docx`: current syllabus

## Getting Started

You can work with this repository either locally or in a devcontainer/Codespace.

### Option 1: Devcontainer / Codespaces

The repository contains a devcontainer configuration in `.devcontainer/devcontainer.json`.

On container creation, it:

- upgrades `pip`
- installs all dependencies from `requirements.txt` into the default Python 3.12 environment in the container

### Option 2: Local Python Environment

Create or activate a Python environment and install the dependencies:

```bash
pip install -r requirements.txt
```

The course materials use packages such as:

- `jupyter`
- `flask`
- `pandas`
- `matplotlib`
- `scikit-learn`
- `mesa[viz]`
- `agentpy`

## Running the Materials

### Jupyter Notebooks

Open the notebooks directly in VS Code or JupyterLab after installing the dependencies.

### Credit Risk Dashboard

From `Agent_Based_Credit_Risk_Modeling/web_app/`:

```bash
python server.py
```

Then open:

```text
http://127.0.0.1:8002/
```

### Mesa and Cellular Automata Web Apps

Each app can be started from its own folder with:

```bash
python server.py
```

Current default ports:

- Wolf-Sheep Predation: `http://localhost:8000/`
- Schelling Segregation: `http://localhost:8001/`
- Boltzmann Wealth Model: `http://localhost:8003/`
- Conway's Game of Life: `http://localhost:8004/`

## Sensitivity Analysis

Several apps in this repository include sensitivity analysis both in the browser and as standalone Python scripts. These analyses are used to compare how parameter changes affect outcomes such as:

- inequality
- convergence
- extinction dynamics
- default rates
- return on investment

Where available, the shared run logic is stored in a local `sensitivity_core.py`, and larger parameter sweeps can also be executed from the command line.

## Intended Use in the Course

This repository is designed to support hands-on teaching. Students are expected to:

- inspect and modify notebooks
- run simulation models
- explore parameter settings
- interpret charts and heatmaps
- connect model logic to FinTech use cases such as credit risk
- move from exploratory modeling to small deployable applications