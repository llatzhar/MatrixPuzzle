import type { GenerateInput, Puzzle } from "../model/types.js";
import { validateGenerateInput, validatePuzzle } from "./schema.js";

export function parseGenerateInput(raw: unknown): GenerateInput {
  return validateGenerateInput(raw);
}

export function parsePuzzle(raw: unknown): Puzzle {
  return validatePuzzle(raw);
}
