import type { Clue, ClueLogic, Puzzle } from "../model/types.js";

export type EntityRef = {
  cat: number;
  item: number;
};

export type SolverContext = {
  puzzle: Puzzle;
  size: number;
  categories: Puzzle["structure"];
  itemToEntity: Map<string, EntityRef>;
};

export type AssignmentState = {
  // rowAssign[row][cat] = itemIdx, -1 means unassigned.
  rowAssign: number[][];
  // inv[cat][item] = row, -1 means not placed.
  inv: number[][];
};

export function createSolverContext(puzzle: Puzzle): SolverContext {
  const size = puzzle.metadata.size;
  const itemToEntity = new Map<string, EntityRef>();

  puzzle.structure.forEach((cat, cidx) => {
    cat.items.forEach((item, iidx) => {
      itemToEntity.set(item, { cat: cidx, item: iidx });
    });
  });

  return {
    puzzle,
    size,
    categories: puzzle.structure,
    itemToEntity
  };
}

export function initState(ctx: SolverContext): AssignmentState {
  const cats = ctx.categories.length;
  const rowAssign: number[][] = [];

  for (let row = 0; row < ctx.size; row += 1) {
    const rowData = new Array<number>(cats).fill(-1);
    rowData[0] = row;
    rowAssign.push(rowData);
  }

  const inv: number[][] = [];
  for (let c = 0; c < cats; c += 1) {
    const ar = new Array<number>(ctx.size).fill(-1);
    if (c === 0) {
      for (let i = 0; i < ctx.size; i += 1) {
        ar[i] = i;
      }
    }
    inv.push(ar);
  }

  return { rowAssign, inv };
}

export function cloneState(state: AssignmentState): AssignmentState {
  return {
    rowAssign: state.rowAssign.map((r) => [...r]),
    inv: state.inv.map((r) => [...r])
  };
}

export function assign(state: AssignmentState, row: number, cat: number, item: number): void {
  state.rowAssign[row][cat] = item;
  state.inv[cat][item] = row;
}

function resolveEntity(ctx: SolverContext, name: string): EntityRef {
  const found = ctx.itemToEntity.get(name);
  if (!found) {
    throw new Error(`Unknown entity '${name}'`);
  }
  return found;
}

function pairStatus(ctx: SolverContext, state: AssignmentState, a: EntityRef, b: EntityRef): { canBeTrue: boolean; definitelyTrue: boolean } {
  if (a.cat === b.cat) {
    if (a.item === b.item) {
      return { canBeTrue: true, definitelyTrue: true };
    }
    return { canBeTrue: false, definitelyTrue: false };
  }

  const rowA = state.inv[a.cat][a.item];
  const rowB = state.inv[b.cat][b.item];

  if (rowA !== -1 && rowB !== -1) {
    const same = rowA === rowB;
    return { canBeTrue: same, definitelyTrue: same };
  }

  if (rowA !== -1) {
    const current = state.rowAssign[rowA][b.cat];
    if (current === -1) {
      return { canBeTrue: true, definitelyTrue: false };
    }
    const same = current === b.item;
    return { canBeTrue: same, definitelyTrue: same };
  }

  if (rowB !== -1) {
    const current = state.rowAssign[rowB][a.cat];
    if (current === -1) {
      return { canBeTrue: true, definitelyTrue: false };
    }
    const same = current === a.item;
    return { canBeTrue: same, definitelyTrue: same };
  }

  return { canBeTrue: true, definitelyTrue: false };
}

function isNotViolated(ctx: SolverContext, state: AssignmentState, a: EntityRef, b: EntityRef): boolean {
  if (a.cat === b.cat) {
    return a.item !== b.item;
  }

  const rowA = state.inv[a.cat][a.item];
  const rowB = state.inv[b.cat][b.item];

  if (rowA !== -1 && rowB !== -1) {
    return rowA !== rowB;
  }

  if (rowA !== -1) {
    const current = state.rowAssign[rowA][b.cat];
    return current !== b.item;
  }

  if (rowB !== -1) {
    const current = state.rowAssign[rowB][a.cat];
    return current !== a.item;
  }

  return true;
}

function getOrderedValue(ctx: SolverContext, state: AssignmentState, entity: EntityRef, orderedCategory: number): number | null {
  const row = state.inv[entity.cat][entity.item];
  if (row === -1) {
    return null;
  }
  const value = state.rowAssign[row][orderedCategory];
  return value === -1 ? null : value;
}

function isOrderViolated(ctx: SolverContext, state: AssignmentState, logic: Extract<ClueLogic, { type: "order" }>): boolean {
  const a = resolveEntity(ctx, logic.subjects[0]);
  const b = resolveEntity(ctx, logic.subjects[1]);
  const orderCat = ctx.categories.findIndex((c) => c.category === logic.order.category);
  if (orderCat === -1) {
    return true;
  }

  const vA = getOrderedValue(ctx, state, a, orderCat);
  const vB = getOrderedValue(ctx, state, b, orderCat);
  if (vA === null || vB === null) {
    return false;
  }

  if (logic.order.distance === null) {
    return !(vA < vB);
  }

  return !(vB - vA === logic.order.distance);
}

export function isClueConsistent(ctx: SolverContext, state: AssignmentState, clue: Clue): boolean {
  const { logic } = clue;

  if (logic.type === "pair") {
    const a = resolveEntity(ctx, logic.subjects[0]);
    const b = resolveEntity(ctx, logic.subjects[1]);
    return pairStatus(ctx, state, a, b).canBeTrue;
  }

  if (logic.type === "not") {
    const a = resolveEntity(ctx, logic.subjects[0]);
    const b = resolveEntity(ctx, logic.subjects[1]);
    return isNotViolated(ctx, state, a, b);
  }

  if (logic.type === "either") {
    const a = resolveEntity(ctx, logic.subjects[0]);
    const b = resolveEntity(ctx, logic.subjects[1]);
    const c = resolveEntity(ctx, logic.subjects[2]);
    const p1 = pairStatus(ctx, state, a, b);
    const p2 = pairStatus(ctx, state, a, c);
    return p1.canBeTrue || p2.canBeTrue;
  }

  if (logic.type === "xor") {
    const a = resolveEntity(ctx, logic.subjects[0]);
    const b = resolveEntity(ctx, logic.subjects[1]);
    const c = resolveEntity(ctx, logic.subjects[2]);
    const p1 = pairStatus(ctx, state, a, b);
    const p2 = pairStatus(ctx, state, a, c);

    if (!p1.canBeTrue && !p2.canBeTrue) {
      return false;
    }
    if (p1.definitelyTrue && p2.definitelyTrue) {
      return false;
    }
    return true;
  }

  return !isOrderViolated(ctx, state, logic);
}

export function isClueSatisfied(ctx: SolverContext, state: AssignmentState, clue: Clue): boolean {
  const { logic } = clue;

  if (logic.type === "pair") {
    const a = resolveEntity(ctx, logic.subjects[0]);
    const b = resolveEntity(ctx, logic.subjects[1]);
    return pairStatus(ctx, state, a, b).definitelyTrue;
  }

  if (logic.type === "not") {
    const a = resolveEntity(ctx, logic.subjects[0]);
    const b = resolveEntity(ctx, logic.subjects[1]);
    return isNotViolated(ctx, state, a, b);
  }

  if (logic.type === "either") {
    const a = resolveEntity(ctx, logic.subjects[0]);
    const b = resolveEntity(ctx, logic.subjects[1]);
    const c = resolveEntity(ctx, logic.subjects[2]);
    const p1 = pairStatus(ctx, state, a, b);
    const p2 = pairStatus(ctx, state, a, c);
    return p1.definitelyTrue || p2.definitelyTrue;
  }

  if (logic.type === "xor") {
    const a = resolveEntity(ctx, logic.subjects[0]);
    const b = resolveEntity(ctx, logic.subjects[1]);
    const c = resolveEntity(ctx, logic.subjects[2]);
    const p1 = pairStatus(ctx, state, a, b).definitelyTrue;
    const p2 = pairStatus(ctx, state, a, c).definitelyTrue;
    return (p1 || p2) && !(p1 && p2);
  }

  return !isOrderViolated(ctx, state, logic);
}

export function allCluesConsistent(ctx: SolverContext, state: AssignmentState): boolean {
  return ctx.puzzle.clues.every((clue) => isClueConsistent(ctx, state, clue));
}

export function allCluesSatisfied(ctx: SolverContext, state: AssignmentState): boolean {
  return ctx.puzzle.clues.every((clue) => isClueSatisfied(ctx, state, clue));
}

export function toSolutionRows(ctx: SolverContext, state: AssignmentState): Record<string, string>[] {
  const rows: Record<string, string>[] = [];

  for (let row = 0; row < ctx.size; row += 1) {
    const out: Record<string, string> = {};
    ctx.categories.forEach((cat, cidx) => {
      const itemIdx = state.rowAssign[row][cidx];
      out[cat.category] = cat.items[itemIdx];
    });
    rows.push(out);
  }

  return rows;
}

export function isComplete(ctx: SolverContext, state: AssignmentState): boolean {
  for (let row = 0; row < ctx.size; row += 1) {
    for (let cat = 1; cat < ctx.categories.length; cat += 1) {
      if (state.rowAssign[row][cat] === -1) {
        return false;
      }
    }
  }
  return true;
}
