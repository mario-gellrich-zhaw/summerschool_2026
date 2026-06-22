# Conway's Game of Life

## Summary

This dashboard turns Mesa's Conway's Game of Life example into a browser-based sandbox. You can reset random worlds, step or autoplay the automaton, and click individual cells to design patterns directly on the grid. A live chart tracks the alive-cell population over time.

## How to Run

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
| Play Interval | 140 ms | Animation speed during autoplay. |

## Interaction

* **Reset** creates a new random world using the current parameters.
* **Step** advances the rules by one tick.
* **Play** runs repeated steps until paused.
* **Click a cell** to toggle it alive or dead before or during the simulation.

## Files

* `server.py`: Flask backend and JSON endpoints.
* `static/`: D3 frontend assets.

## Further Reading

Mesa example documentation:
https://mesa.readthedocs.io/latest/examples/basic/conways_game_of_life.html# Conway's Game of Life

## Summary

This folder contains a standalone Flask plus D3 dashboard for Mesa's Conway's Game of Life example. You can generate a random initial pattern, step or autoplay the automaton, and click individual cells to seed your own structures before running the model.

## How to Run

```bash
python server.py
```

Then open http://localhost:8004/ in a browser.

## Adjustable Parameters

| Parameter | Default | Meaning |
|---|---:|---|
| Grid Width / Height | 40 / 28 | Size of the automaton board. |
| Initial Alive Fraction | 0.24 | Fraction of cells seeded alive on reset. |
| Random Seed | 42 | Reproducible random starting pattern. |
| Play Interval | 120 ms | Animation speed while autoplay is running. |

## Interaction

* **Reset** rebuilds the board from the current parameters.
* **Step** advances the automaton by one tick.
* **Play / Pause** runs continuously.
* **Click a cell** to toggle it alive or dead before or during a run.

The dashboard also shows the share of alive cells over time and a live density strip so students can compare sparse, balanced, and overcrowded patterns.

## Files

* `server.py`: Flask backend and dashboard API.
* `static/`: D3 frontend assets.

## Further Reading

Mesa example documentation:
https://mesa.readthedocs.io/latest/examples/basic/conways_game_of_life.html