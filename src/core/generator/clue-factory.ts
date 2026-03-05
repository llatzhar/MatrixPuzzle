import type { Category, Clue, ClueType, SolutionRow } from "../model/types.js";
import { SeededRng } from "../../shared/deterministic.js";

function valueOf(solution: SolutionRow[], row: number, category: string): string {
  const v = solution[row][category];
  if (!v) {
    throw new Error(`Solution missing value for ${category}`);
  }
  return v;
}

function pickDifferent(items: string[], actual: string, rng: SeededRng): string {
  const pool = items.filter((it) => it !== actual);
  return pool[rng.int(pool.length)];
}

export function buildClueCandidates(
  structure: Category[],
  solution: SolutionRow[],
  allowed: ClueType[],
  rng: SeededRng
): Clue[] {
  const clues: Clue[] = [];
  const anchor = structure[0];
  let nextId = 1;

  for (let row = 0; row < solution.length; row += 1) {
    const anchorItem = valueOf(solution, row, anchor.category);

    for (let c = 1; c < structure.length; c += 1) {
      const cat = structure[c];
      const item = valueOf(solution, row, cat.category);

      if (allowed.includes("pair")) {
        clues.push({
          id: nextId++,
          text: `${anchorItem} is paired with ${item}.`,
          logic: { type: "pair", subjects: [anchorItem, item] }
        });
      }

      if (allowed.includes("not")) {
        const wrong = pickDifferent(cat.items, item, rng);
        clues.push({
          id: nextId++,
          text: `${anchorItem} is not ${wrong}.`,
          logic: { type: "not", subjects: [anchorItem, wrong] }
        });
      }

      if (allowed.includes("either") && cat.items.length >= 3) {
        const wrong = pickDifferent(cat.items, item, rng);
        clues.push({
          id: nextId++,
          text: `${anchorItem} is either ${item} or ${wrong}.`,
          logic: { type: "either", subjects: [anchorItem, item, wrong] }
        });
      }

      if (allowed.includes("xor") && cat.items.length >= 3) {
        const wrong = pickDifferent(cat.items, item, rng);
        clues.push({
          id: nextId++,
          text: `${anchorItem} is exactly one of ${item} and ${wrong}.`,
          logic: { type: "xor", subjects: [anchorItem, item, wrong] }
        });
      }
    }
  }

  if (allowed.includes("order")) {
    const ordered = structure.find((c) => c.ordered);
    if (ordered) {
      for (let i = 0; i < solution.length; i += 1) {
        for (let j = i + 1; j < solution.length; j += 1) {
          const ai = valueOf(solution, i, anchor.category);
          const aj = valueOf(solution, j, anchor.category);
          const vi = ordered.items.indexOf(valueOf(solution, i, ordered.category));
          const vj = ordered.items.indexOf(valueOf(solution, j, ordered.category));
          if (vi < vj) {
            clues.push({
              id: nextId++,
              text: `${ai} is before ${aj} in ${ordered.category}.`,
              logic: {
                type: "order",
                subjects: [ai, aj],
                order: { category: ordered.category, relation: "before", distance: null }
              }
            });
          }
        }
      }
    }
  }

  return rng.shuffle(clues).map((clue, idx) => ({ ...clue, id: idx + 1 }));
}
