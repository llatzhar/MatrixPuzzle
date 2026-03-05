import type { Category, SolutionRow } from "../model/types.js";
import { SeededRng } from "../../shared/deterministic.js";

function range(n: number): number[] {
  return [...Array(n).keys()];
}

export function buildRandomSolution(structure: Category[], rng: SeededRng): SolutionRow[] {
  const size = structure[0].items.length;
  const rows: SolutionRow[] = [];
  const perms: number[][] = [];

  perms.push(range(size));
  for (let c = 1; c < structure.length; c += 1) {
    perms.push(rng.shuffle(range(size)));
  }

  for (let row = 0; row < size; row += 1) {
    const out: SolutionRow = {};
    for (let c = 0; c < structure.length; c += 1) {
      out[structure[c].category] = structure[c].items[perms[c][row]];
    }
    rows.push(out);
  }

  return rows;
}
