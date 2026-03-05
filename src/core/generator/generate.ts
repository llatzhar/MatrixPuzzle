import type { Clue, DifficultyLabel, GenerateInput, Puzzle } from "../model/types.js";
import { AppError } from "../model/error-codes.js";
import { SeededRng } from "../../shared/deterministic.js";
import { countSolutions } from "../solver-exact/count-solutions.js";
import { solveWithLogic } from "../solver-logic/solve.js";
import { buildRandomSolution } from "./build-solution.js";
import { buildClueCandidates } from "./clue-factory.js";

function matchesTarget(target: DifficultyLabel, estimated: DifficultyLabel): boolean {
  if (target === "easy") {
    return estimated === "easy";
  }
  if (target === "medium") {
    return estimated === "medium";
  }
  return estimated === "hard";
}

function makePuzzle(input: GenerateInput, clues: Clue[], solution: Puzzle["solution"]): Puzzle {
  return {
    metadata: {
      ...input.metadata
    },
    structure: input.structure,
    clues,
    solution
  };
}

export function generatePuzzle(input: GenerateInput): Puzzle {
  const seed = input.metadata.seed ?? Date.now();
  const rng = new SeededRng(seed);

  for (let attempt = 0; attempt < input.generation.max_attempts; attempt += 1) {
    const solution = buildRandomSolution(input.structure, rng);
    const candidates = buildClueCandidates(
      input.structure,
      solution,
      input.generation.allowed_clue_types,
      rng
    );

    const chosen: Clue[] = [];
    const minClues = input.metadata.size * (input.metadata.size - 1);

    for (const clue of candidates) {
      chosen.push(clue);
      if (chosen.length < minClues) {
        continue;
      }

      const puzzleCandidate = makePuzzle(input, chosen, solution);
      const exact = countSolutions(puzzleCandidate, 2);
      if (!exact.unique_solution && input.generation.require_unique_solution) {
        continue;
      }

      if (exact.solution_count === 0) {
        continue;
      }

      const logical = solveWithLogic(puzzleCandidate);
      const estimated = logical.difficulty.label;

      if (!input.generation.allow_assumption_required && logical.difficulty.technique_usage.assumption > 0) {
        continue;
      }

      if (input.metadata.difficulty_target !== undefined && !matchesTarget(input.metadata.difficulty_target, estimated)) {
        continue;
      }

      return {
        ...puzzleCandidate,
        metadata: {
          ...puzzleCandidate.metadata,
          difficulty_estimated: estimated,
          seed
        },
        solution: exact.sample_solution ?? solution
      };
    }
  }

  throw new AppError("GENERATION_FAILED", "Failed to generate a puzzle within max_attempts");
}
