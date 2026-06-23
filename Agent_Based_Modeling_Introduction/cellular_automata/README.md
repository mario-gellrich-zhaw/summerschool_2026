# Conway's Game of Life

Folder: `Agent_Based_Modeling_Introduction/cellular_automata/`

## Summary

This dashboard provides a browser-based sandbox for Conway's Game of Life and related Life-like rules. You can reset random worlds, step or autoplay the automaton, select different rules, and click individual cells to design patterns directly on the grid. A live chart tracks the alive-cell population over time.

## How to Run

From this folder, run:

```bash
python server.py
```

Then open http://localhost:8004/ in a browser.

## Adjustable Parameters

| Parameter | Default | Meaning |
|---|---:|---|
| Grid Width / Height | 36 / 24 | Size of the cellular automaton board. |
| Initial Fraction Alive | 0.24 | Probability that each cell starts alive after reset. |
| Random Seed | 42 | Reproducible starting layouts. |
| Rule | Classic Conway | Active Life-like birth/survival rule. |
| Play Interval | 140 ms | Animation speed during autoplay. |

## Interaction

* **Reset** creates a new random world using the current parameters.
* **Step** advances the rules by one tick.
* **Play** runs repeated steps until paused.
* **Click a cell** to toggle it alive or dead before or during the simulation.

## Files

* `server.py`: Flask backend and JSON endpoints.
* `model.py`: custom Life-like automaton logic with configurable rules.
* `README.md`: folder-level documentation for this app.
* `static/`: D3 frontend assets.

## Further Reading

Mesa example documentation:
https://mesa.readthedocs.io/latest/examples/basic/conways_game_of_life.html