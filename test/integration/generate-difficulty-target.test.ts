import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseGenerateInput } from "../../src/core/parser/validate.js";
import { generatePuzzle } from "../../src/core/generator/generate.js";

async function loadConfig(): Promise<Record<string, unknown>> {
  const text = await readFile("config.json", "utf8");
  return JSON.parse(text) as Record<string, unknown>;
}

test("generate succeeds without difficulty_target", async () => {
  const raw = await loadConfig();
  const metadata = raw.metadata as Record<string, unknown>;
  delete metadata.difficulty_target;

  const input = parseGenerateInput(raw);
  const puzzle = generatePuzzle(input);

  assert.equal(puzzle.metadata.difficulty_target, undefined);
  assert.equal(typeof puzzle.metadata.difficulty_estimated, "string");
  assert.equal(puzzle.metadata.size, 3);
  assert.ok(Array.isArray(puzzle.clues) && puzzle.clues.length > 0);
});

test("generate respects medium difficulty_target when specified", async () => {
  const raw = await loadConfig();
  const metadata = raw.metadata as Record<string, unknown>;
  metadata.difficulty_target = "medium";

  const input = parseGenerateInput(raw);
  const puzzle = generatePuzzle(input);

  assert.equal(puzzle.metadata.difficulty_target, "medium");
  assert.equal(puzzle.metadata.difficulty_estimated, "medium");
});
