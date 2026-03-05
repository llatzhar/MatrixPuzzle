import { AppError, toErrorResult } from "../../core/model/error-codes.js";
import { readPuzzle, writeOutput } from "../../core/parser/io.js";
import { parsePuzzle } from "../../core/parser/validate.js";
import { solveWithLogic } from "../../core/solver-logic/solve.js";

type SolveArgs = {
  inPath: string;
  outPath: string;
};

export async function runSolve(args: SolveArgs): Promise<number> {
  try {
    const raw = await readPuzzle(args.inPath);
    const puzzle = parsePuzzle(raw);
    const result = solveWithLogic(puzzle);

    if (result.solution_count === 0) {
      await writeOutput(args.outPath, {
        ...result,
        status: "unsolved"
      });
      return 1;
    }

    if (!result.unique_solution) {
      await writeOutput(args.outPath, result);
      return 1;
    }

    await writeOutput(args.outPath, result);
    return 0;
  } catch (error) {
    if (error instanceof AppError) {
      await writeOutput(args.outPath, toErrorResult(error.code, error.message));
      return 1;
    }

    const message = error instanceof Error ? error.message : String(error);
    await writeOutput(args.outPath, toErrorResult("INTERNAL_ERROR", message));
    return 1;
  }
}
