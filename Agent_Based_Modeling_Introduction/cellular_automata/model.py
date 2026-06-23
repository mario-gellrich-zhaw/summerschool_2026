from __future__ import annotations

import re

import numpy as np


RULE_PATTERN = re.compile(r"^B[0-8]*S[0-8]*$", re.IGNORECASE)


class LifeLikeAutomaton:
    def __init__(self, width: int, height: int, initial_fraction_alive: float, rule: str = "B3S23", seed: int = 42):
        self.width = int(width)
        self.height = int(height)
        self.initial_fraction_alive = float(initial_fraction_alive)
        self.rule = self._normalize_rule(rule)
        self._birth, self._survive = self._parse_rule(self.rule)
        self._rng = np.random.default_rng(seed)
        self.board = self._rng.random((self.height, self.width)) < self.initial_fraction_alive
        self.running = True

    @staticmethod
    def _normalize_rule(rule: str) -> str:
        normalized = str(rule).strip().upper()
        if not RULE_PATTERN.match(normalized):
            raise ValueError("Rule must use Life-like notation such as B3S23 or B2S125")
        return normalized

    @staticmethod
    def _parse_rule(rule: str) -> tuple[set[int], set[int]]:
        birth_text, survive_text = rule[1:].split("S", maxsplit=1)
        birth = {int(char) for char in birth_text}
        survive = {int(char) for char in survive_text}
        return birth, survive

    def _neighbor_counts(self) -> np.ndarray:
        board = self.board.astype(np.int8)
        neighbors = np.zeros(board.shape, dtype=np.int8)
        neighbors[:-1, :] += board[1:, :]
        neighbors[:, :-1] += board[:, 1:]
        neighbors[1:, :] += board[:-1, :]
        neighbors[:, 1:] += board[:, :-1]
        neighbors[:-1, :-1] += board[1:, 1:]
        neighbors[1:, :-1] += board[:-1, 1:]
        neighbors[1:, 1:] += board[:-1, :-1]
        neighbors[:-1, 1:] += board[1:, :-1]
        return neighbors

    def step(self) -> None:
        neighbors = self._neighbor_counts()
        next_board = np.zeros_like(self.board, dtype=bool)
        for birth_count in self._birth:
            next_board |= (~self.board) & (neighbors == birth_count)
        for survive_count in self._survive:
            next_board |= self.board & (neighbors == survive_count)
        self.board = next_board

    def set_cell(self, x: int, y: int, alive: bool) -> None:
        self.board[int(y), int(x)] = bool(alive)

    def toggle_cell(self, x: int, y: int) -> bool:
        self.board[int(y), int(x)] = ~self.board[int(y), int(x)]
        return bool(self.board[int(y), int(x)])

    def alive_count(self) -> int:
        return int(self.board.sum())

    def alive_share(self) -> float:
        total = self.width * self.height
        return self.alive_count() / total if total else 0.0

    def cell_payload(self) -> list[dict[str, int | bool]]:
        payload = []
        for y in range(self.height):
            for x in range(self.width):
                payload.append({"x": x, "y": y, "alive": bool(self.board[y, x])})
        return payload