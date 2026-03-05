import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parsePuzzle } from "../../src/core/parser/validate.js";
import { solveWithLogic } from "../../src/core/solver-logic/solve.js";

test("solve sample puzzle", async () => {
  const text = await readFile("puzzle.json", "utf8");
  const raw = JSON.parse(text);
  const puzzle = parsePuzzle(raw);
  const result = solveWithLogic(puzzle);

  assert.equal(result.solution_count, 1);
  assert.equal(result.unique_solution, true);
  assert.equal(result.status, "solved");
  assert.equal(result.solution.length, puzzle.metadata.size);
});
