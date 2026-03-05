import {
  allCluesConsistent,
  allCluesSatisfied,
  assign,
  cloneState,
  createSolverContext,
  initState,
  isComplete,
  toSolutionRows,
  type AssignmentState
} from "./constraints.js";
import type { Puzzle, SolutionRow } from "../model/types.js";

export type ExactSolveOptions = {
  maxSolutions?: number;
};

export type ExactSolveResult = {
  solutionCount: number;
  solutions: SolutionRow[][];
  exploredNodes: number;
};

type Variable = {
  row: number;
  cat: number;
};

function variableList(size: number, cats: number): Variable[] {
  const vars: Variable[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let cat = 1; cat < cats; cat += 1) {
      vars.push({ row, cat });
    }
  }
  return vars;
}

function candidatesFor(state: AssignmentState, variable: Variable, size: number): number[] {
  const used = new Set<number>();
  for (let row = 0; row < size; row += 1) {
    const val = state.rowAssign[row][variable.cat];
    if (val !== -1) {
      used.add(val);
    }
  }

  const out: number[] = [];
  for (let item = 0; item < size; item += 1) {
    if (!used.has(item)) {
      out.push(item);
    }
  }
  return out;
}

export function solveExact(puzzle: Puzzle, options?: ExactSolveOptions): ExactSolveResult {
  const ctx = createSolverContext(puzzle);
  const maxSolutions = options?.maxSolutions ?? Number.POSITIVE_INFINITY;
  const vars = variableList(ctx.size, ctx.categories.length);
  let exploredNodes = 0;
  const foundSolutions: SolutionRow[][] = [];

  function chooseVar(state: AssignmentState): { variable: Variable; domain: number[] } | null {
    let bestVar: Variable | null = null;
    let bestDomain: number[] = [];

    for (const v of vars) {
      if (state.rowAssign[v.row][v.cat] !== -1) {
        continue;
      }
      const domain = candidatesFor(state, v, ctx.size);
      if (domain.length === 0) {
        return { variable: v, domain };
      }
      if (!bestVar || domain.length < bestDomain.length) {
        bestVar = v;
        bestDomain = domain;
      }
    }

    if (!bestVar) {
      return null;
    }
    return { variable: bestVar, domain: bestDomain };
  }

  function dfs(state: AssignmentState): void {
    if (foundSolutions.length >= maxSolutions) {
      return;
    }

    exploredNodes += 1;

    if (!allCluesConsistent(ctx, state)) {
      return;
    }

    if (isComplete(ctx, state)) {
      if (allCluesSatisfied(ctx, state)) {
        foundSolutions.push(toSolutionRows(ctx, state));
      }
      return;
    }

    const picked = chooseVar(state);
    if (!picked) {
      return;
    }

    const { variable, domain } = picked;
    if (domain.length === 0) {
      return;
    }

    for (const item of domain) {
      const next = cloneState(state);
      assign(next, variable.row, variable.cat, item);
      dfs(next);
      if (foundSolutions.length >= maxSolutions) {
        return;
      }
    }
  }

  dfs(initState(ctx));

  return {
    solutionCount: foundSolutions.length,
    solutions: foundSolutions,
    exploredNodes
  };
}
