import type { Puzzle, SolveResult, SolveTraceStep, Technique } from "../model/types.js";
import { countSolutions } from "../solver-exact/count-solutions.js";
import { levelFromUsage } from "./difficulty.js";

type CandidateGrid = boolean[][][];

function initGrid(size: number, categories: number): CandidateGrid {
  const grid: CandidateGrid = [];
  for (let row = 0; row < size; row += 1) {
    const byCat: boolean[][] = [];
    for (let cat = 0; cat < categories; cat += 1) {
      if (cat === 0) {
        const arr = new Array<boolean>(size).fill(false);
        arr[row] = true;
        byCat.push(arr);
      } else {
        byCat.push(new Array<boolean>(size).fill(true));
      }
    }
    grid.push(byCat);
  }
  return grid;
}

function findEntity(structure: Puzzle["structure"], name: string): { cat: number; item: number } {
  for (let c = 0; c < structure.length; c += 1) {
    const idx = structure[c].items.indexOf(name);
    if (idx >= 0) {
      return { cat: c, item: idx };
    }
  }
  throw new Error(`Unknown entity '${name}'`);
}

function setOnly(grid: CandidateGrid, row: number, cat: number, item: number): number {
  let changes = 0;
  for (let i = 0; i < grid[row][cat].length; i += 1) {
    const next = i === item;
    if (grid[row][cat][i] !== next) {
      grid[row][cat][i] = next;
      changes += 1;
    }
  }

  for (let r = 0; r < grid.length; r += 1) {
    if (r !== row && grid[r][cat][item]) {
      grid[r][cat][item] = false;
      changes += 1;
    }
  }

  return changes;
}

function setNot(grid: CandidateGrid, row: number, cat: number, item: number): number {
  if (!grid[row][cat][item]) {
    return 0;
  }
  grid[row][cat][item] = false;
  return 1;
}

function resolvedRowForEntity(grid: CandidateGrid, structure: Puzzle["structure"], name: string): number | null {
  const e = findEntity(structure, name);
  if (e.cat === 0) {
    return e.item;
  }

  let row: number | null = null;
  for (let r = 0; r < grid.length; r += 1) {
    if (grid[r][e.cat][e.item]) {
      if (row !== null) {
        return null;
      }
      row = r;
    }
  }
  return row;
}

function applyDirectClues(puzzle: Puzzle, grid: CandidateGrid): number {
  let changes = 0;
  for (const clue of puzzle.clues) {
    const { logic } = clue;

    if (logic.type === "pair") {
      const a = findEntity(puzzle.structure, logic.subjects[0]);
      const b = findEntity(puzzle.structure, logic.subjects[1]);
      if (a.cat === 0 && b.cat !== 0) {
        changes += setOnly(grid, a.item, b.cat, b.item);
      }
      if (b.cat === 0 && a.cat !== 0) {
        changes += setOnly(grid, b.item, a.cat, a.item);
      }
    }

    if (logic.type === "not") {
      const a = findEntity(puzzle.structure, logic.subjects[0]);
      const b = findEntity(puzzle.structure, logic.subjects[1]);
      if (a.cat === 0 && b.cat !== 0) {
        changes += setNot(grid, a.item, b.cat, b.item);
      }
      if (b.cat === 0 && a.cat !== 0) {
        changes += setNot(grid, b.item, a.cat, a.item);
      }
    }
  }
  return changes;
}

function applyElimination(grid: CandidateGrid): number {
  let changes = 0;

  for (let row = 0; row < grid.length; row += 1) {
    for (let cat = 1; cat < grid[row].length; cat += 1) {
      let count = 0;
      let last = -1;
      for (let item = 0; item < grid[row][cat].length; item += 1) {
        if (grid[row][cat][item]) {
          count += 1;
          last = item;
        }
      }
      if (count === 1) {
        changes += setOnly(grid, row, cat, last);
      }
    }
  }

  const size = grid.length;
  const cats = grid[0].length;
  for (let cat = 1; cat < cats; cat += 1) {
    for (let item = 0; item < size; item += 1) {
      let count = 0;
      let rowCandidate = -1;
      for (let row = 0; row < size; row += 1) {
        if (grid[row][cat][item]) {
          count += 1;
          rowCandidate = row;
        }
      }
      if (count === 1) {
        changes += setOnly(grid, rowCandidate, cat, item);
      }
    }
  }

  return changes;
}

function applyCross(puzzle: Puzzle, grid: CandidateGrid): number {
  let changes = 0;

  for (const clue of puzzle.clues) {
    const { logic } = clue;

    if (logic.type === "either" || logic.type === "xor") {
      const aRow = resolvedRowForEntity(grid, puzzle.structure, logic.subjects[0]);
      const b = findEntity(puzzle.structure, logic.subjects[1]);
      const c = findEntity(puzzle.structure, logic.subjects[2]);

      if (aRow !== null && b.cat === c.cat && b.cat !== 0) {
        for (let item = 0; item < puzzle.metadata.size; item += 1) {
          if (item !== b.item && item !== c.item && grid[aRow][b.cat][item]) {
            grid[aRow][b.cat][item] = false;
            changes += 1;
          }
        }
      }
    }
  }

  return changes;
}

function isSolved(grid: CandidateGrid): boolean {
  for (let row = 0; row < grid.length; row += 1) {
    for (let cat = 1; cat < grid[row].length; cat += 1) {
      let count = 0;
      for (let item = 0; item < grid[row][cat].length; item += 1) {
        if (grid[row][cat][item]) {
          count += 1;
        }
      }
      if (count !== 1) {
        return false;
      }
    }
  }
  return true;
}

export function solveWithLogic(puzzle: Puzzle): SolveResult {
  const grid = initGrid(puzzle.metadata.size, puzzle.structure.length);
  const trace: SolveTraceStep[] = [];
  const usage: Record<Technique, number> = {
    elimination: 0,
    cross: 0,
    assumption: 0
  };

  let step = 1;

  const direct = applyDirectClues(puzzle, grid);
  if (direct > 0) {
    usage.elimination += direct;
    trace.push({ step: step++, technique: "elimination", description: `Applied direct clues (${direct} updates).` });
  }

  let changed = true;
  while (changed) {
    const delta = applyElimination(grid);
    changed = delta > 0;
    if (delta > 0) {
      usage.elimination += delta;
      trace.push({ step: step++, technique: "elimination", description: `Elimination propagated (${delta} updates).` });
    }
  }

  if (!isSolved(grid)) {
    const crossDelta = applyCross(puzzle, grid);
    if (crossDelta > 0) {
      usage.cross += crossDelta;
      trace.push({ step: step++, technique: "cross", description: `Applied cross constraints (${crossDelta} updates).` });
    } else if (puzzle.clues.some((c) => c.logic.type === "either" || c.logic.type === "xor" || c.logic.type === "order")) {
      usage.cross += 1;
      trace.push({ step: step++, technique: "cross", description: "Cross-level clues are required to complete deduction." });
    }
  }

  const exact = countSolutions(puzzle, 2);
  if (exact.unique_solution && !isSolved(grid)) {
    usage.assumption += 1;
    trace.push({ step: step++, technique: "assumption", description: "Unique solution confirmed only after exact search fallback." });
  }

  const level = levelFromUsage(usage);

  return {
    status: exact.solution_count > 0 ? "solved" : "unsolved",
    unique_solution: exact.unique_solution,
    solution_count: exact.solution_count,
    difficulty: {
      level: level.level,
      label: level.label,
      max_technique: level.max_technique,
      technique_usage: usage
    },
    trace,
    solution: exact.sample_solution ?? []
  };
}
