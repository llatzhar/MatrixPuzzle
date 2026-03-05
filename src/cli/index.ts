import { runGenerate } from "./commands/generate.js";
import { runSolve } from "./commands/solve.js";

function usage(): string {
  return [
    "Usage:",
    "  generate --in <config.json> --out <puzzle.json> [--omit-solution]",
    "  solve --in <puzzle.json> --out <result.json>"
  ].join("\n");
}

function parseArgs(argv: string[]): {
  command: "generate" | "solve";
  inPath: string;
  outPath: string;
  omitSolution: boolean;
} {
  const [commandRaw, ...rest] = argv;
  if (commandRaw !== "generate" && commandRaw !== "solve") {
    throw new Error(usage());
  }

  let inPath = "";
  let outPath = "";
  let omitSolution = false;

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (token === "--in") {
      inPath = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (token === "--out") {
      outPath = rest[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (token === "--omit-solution") {
      omitSolution = true;
      continue;
    }
  }

  if (!inPath || !outPath) {
    throw new Error(usage());
  }

  return {
    command: commandRaw,
    inPath,
    outPath,
    omitSolution
  };
}

async function main(): Promise<void> {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.command === "generate") {
      process.exitCode = await runGenerate({
        inPath: args.inPath,
        outPath: args.outPath,
        omitSolution: args.omitSolution
      });
      return;
    }

    process.exitCode = await runSolve({
      inPath: args.inPath,
      outPath: args.outPath
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${msg}\n`);
    process.exitCode = 1;
  }
}

void main();
