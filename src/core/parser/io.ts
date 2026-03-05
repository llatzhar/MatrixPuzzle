import type { GenerateInput, Puzzle } from "../model/types.js";
import { readJsonFile, writeJsonFile } from "../../shared/json.js";

export async function readGenerateInput(path: string): Promise<GenerateInput> {
  return readJsonFile<GenerateInput>(path);
}

export async function readPuzzle(path: string): Promise<Puzzle> {
  return readJsonFile<Puzzle>(path);
}

export async function writeOutput(path: string, data: unknown): Promise<void> {
  await writeJsonFile(path, data);
}
