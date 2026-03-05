import type { Puzzle } from "../model/types.js";
import { solveExact } from "./backtrack.js";

export type CountSolutionsResult = {
  solution_count: number;
  unique_solution: boolean;
  sample_solution: Record<string, string>[] | null;
  explored_nodes: number;
};

export function countSolutions(puzzle: Puzzle, maxSolutions = 2): CountSolutionsResult {
  const exact = solveExact(puzzle, { maxSolutions });
  return {
    solution_count: exact.solutionCount,
    unique_solution: exact.solutionCount === 1,
    sample_solution: exact.solutions[0] ?? null,
    explored_nodes: exact.exploredNodes
  };
}
