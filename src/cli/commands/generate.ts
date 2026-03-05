import { AppError, toErrorResult } from "../../core/model/error-codes.js";
import { readGenerateInput, writeOutput } from "../../core/parser/io.js";
import { parseGenerateInput } from "../../core/parser/validate.js";
import { generatePuzzle } from "../../core/generator/generate.js";

type GenerateArgs = {
  inPath: string;
  outPath: string;
  omitSolution: boolean;
};

export async function runGenerate(args: GenerateArgs): Promise<number> {
  try {
    const raw = await readGenerateInput(args.inPath);
    const input = parseGenerateInput(raw);
    const puzzle = generatePuzzle(input);

    if (args.omitSolution) {
      const { solution: _ignored, ...withoutSolution } = puzzle;
      await writeOutput(args.outPath, withoutSolution);
    } else {
      await writeOutput(args.outPath, puzzle);
    }

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
