import type { Clue, ClueLogic, GenerateInput, Puzzle } from "../model/types.js";
import { AppError } from "../model/error-codes.js";

type EntityIndex = {
  byItem: Map<string, number>;
  categoryOfItem: Map<string, string>;
};

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new AppError("INVALID_INPUT", message);
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function buildEntityIndex(structure: GenerateInput["structure"] | Puzzle["structure"]): EntityIndex {
  const byItem = new Map<string, number>();
  const categoryOfItem = new Map<string, string>();

  structure.forEach((cat, cidx) => {
    cat.items.forEach((item) => {
      assert(!byItem.has(item), `Duplicate item name found: ${item}`);
      byItem.set(item, cidx);
      categoryOfItem.set(item, cat.category);
    });
  });

  return { byItem, categoryOfItem };
}

function validateStructureCommon(structure: unknown, size: 3 | 4): asserts structure is Puzzle["structure"] {
  assert(Array.isArray(structure), "structure must be an array");
  const structureArray = structure as unknown[];
  assert(structureArray.length === size, `structure length must be ${size}`);

  const categoryNames = new Set<string>();

  for (const c of structureArray) {
    assert(isObject(c), "structure element must be an object");
    const catObj = c as Record<string, unknown>;
    assert(typeof catObj.category === "string" && catObj.category.length > 0, "category must be non-empty string");
    const categoryName = catObj.category as string;
    assert(!categoryNames.has(categoryName), `Duplicate category: ${categoryName}`);
    categoryNames.add(categoryName);

    assert(Array.isArray(catObj.items), `items of category ${catObj.category} must be array`);
    const items = catObj.items as unknown[];
    assert(items.length === size, `items of category ${catObj.category} must have ${size} elements`);
    const itemSet = new Set<string>();
    for (const item of items) {
      assert(typeof item === "string" && item.length > 0, `item in category ${catObj.category} must be non-empty string`);
      const itemName = item as string;
      assert(!itemSet.has(itemName), `duplicate item in category ${catObj.category}: ${itemName}`);
      itemSet.add(itemName);
    }
    assert(typeof catObj.ordered === "boolean", `ordered in category ${catObj.category} must be boolean`);
  }
}

function validateLogicSubjects(logic: ClueLogic, index: EntityIndex, structure: Puzzle["structure"]): void {
  const hasItem = (name: string) => index.byItem.has(name);

  if (logic.type === "pair" || logic.type === "not") {
    const [a, b] = logic.subjects;
    assert(hasItem(a) && hasItem(b), `Unknown subject in ${logic.type}`);
    assert(index.byItem.get(a) !== index.byItem.get(b), `${logic.type} subjects must be from different categories`);
  }

  if (logic.type === "either" || logic.type === "xor") {
    const [a, b, c] = logic.subjects;
    assert(hasItem(a) && hasItem(b) && hasItem(c), `Unknown subject in ${logic.type}`);
    assert(index.byItem.get(a) !== index.byItem.get(b), `${logic.type}: A and B must be from different categories`);
    assert(index.byItem.get(a) !== index.byItem.get(c), `${logic.type}: A and C must be from different categories`);
    assert(index.byItem.get(b) === index.byItem.get(c), `${logic.type}: B and C must be from same category`);
    assert(b !== c, `${logic.type}: B and C must be different`);
  }

  if (logic.type === "order") {
    const [a, b] = logic.subjects;
    assert(hasItem(a) && hasItem(b), "Unknown subject in order clue");
    assert(logic.order.relation === "before", "order.relation must be 'before'");
    assert(typeof logic.order.category === "string" && logic.order.category.length > 0, "order.category is required");
    const orderCategory = structure.find((s) => s.category === logic.order.category);
    assert(Boolean(orderCategory), `order category not found: ${logic.order.category}`);
    assert(orderCategory?.ordered === true, `order category must be ordered: ${logic.order.category}`);
    if (logic.order.distance !== null) {
      assert(Number.isInteger(logic.order.distance), "order.distance must be integer or null");
      assert(logic.order.distance > 0, "order.distance must be a positive integer");
    }
  }
}

export function validateGenerateInput(input: unknown): GenerateInput {
  assert(isObject(input), "Input must be object");
  const inputObj = input as Record<string, unknown>;
  const metadata = inputObj.metadata as Record<string, unknown>;
  const structure = inputObj.structure;
  const generation = inputObj.generation as Record<string, unknown>;

  assert(isObject(metadata), "metadata is required");
  assert(typeof metadata.title === "string" && metadata.title.length > 0, "metadata.title is required");
  assert(metadata.size === 3 || metadata.size === 4, "metadata.size must be 3 or 4");
  if (metadata.difficulty_target !== undefined) {
    assert(metadata.difficulty_target === "easy" || metadata.difficulty_target === "medium" || metadata.difficulty_target === "hard", "metadata.difficulty_target must be easy|medium|hard");
  }
  if (metadata.seed !== undefined) {
    assert(Number.isInteger(metadata.seed), "metadata.seed must be integer");
  }

  const size = metadata.size;
  validateStructureCommon(structure, size as 3 | 4);

  assert(isObject(generation), "generation is required");
  const allowedClueTypes = generation.allowed_clue_types;
  assert(Array.isArray(allowedClueTypes), "generation.allowed_clue_types must be an array");
  for (const t of allowedClueTypes as unknown[]) {
    assert(t === "pair" || t === "not" || t === "either" || t === "xor" || t === "order", `Unknown clue type: ${String(t)}`);
  }
  assert(typeof generation.require_unique_solution === "boolean", "generation.require_unique_solution must be boolean");
  assert(typeof generation.allow_assumption_required === "boolean", "generation.allow_assumption_required must be boolean");
  const maxAttempts = generation.max_attempts;
  assert(Number.isInteger(maxAttempts) && (maxAttempts as number) > 0, "generation.max_attempts must be positive integer");

  if ((allowedClueTypes as unknown[]).includes("order")) {
    const hasOrdered = structure.some((s) => s.ordered);
    assert(hasOrdered, "order clues require at least one ordered category");
  }

  return input as GenerateInput;
}

function validateClue(clue: unknown, index: EntityIndex, structure: Puzzle["structure"]): clue is Clue {
  assert(isObject(clue), "clue must be object");
  const clueObj = clue as Record<string, unknown>;
  assert(Number.isInteger(clueObj.id), "clue.id must be integer");
  assert(typeof clueObj.text === "string", "clue.text must be string");
  assert(isObject(clueObj.logic), "clue.logic must be object");
  const logicObj = clueObj.logic as Record<string, unknown>;

  const type = logicObj.type;
  assert(type === "pair" || type === "not" || type === "either" || type === "xor" || type === "order", "invalid clue.logic.type");

  if (type === "pair" || type === "not") {
    assert(Array.isArray(logicObj.subjects) && logicObj.subjects.length === 2, `${type} must have 2 subjects`);
  }
  if (type === "either" || type === "xor") {
    assert(Array.isArray(logicObj.subjects) && logicObj.subjects.length === 3, `${type} must have 3 subjects`);
  }
  if (type === "order") {
    assert(Array.isArray(logicObj.subjects) && logicObj.subjects.length === 2, "order must have 2 subjects");
    assert(isObject(logicObj.order), "order clue must include order object");
    const distance = (logicObj.order as Record<string, unknown>).distance;
    if (distance !== null && distance !== undefined) {
      assert(Number.isInteger(distance) && (distance as number) > 0, "order.distance must be positive integer or null");
    }
  }

  validateLogicSubjects(logicObj as ClueLogic, index, structure);
  return true;
}

function validateOptionalSolution(puzzle: Puzzle): void {
  if (!puzzle.solution) {
    return;
  }

  const size = puzzle.metadata.size;
  assert(Array.isArray(puzzle.solution) && puzzle.solution.length === size, "solution length must match size");

  const anchorCategory = puzzle.structure[0]?.category;
  assert(Boolean(anchorCategory), "structure must include at least one category");

  const rowSeen = new Set<string>();
  for (const row of puzzle.solution) {
    assert(isObject(row), "solution row must be object");
    for (const cat of puzzle.structure) {
      const val = row[cat.category];
      assert(typeof val === "string", `solution row must include category: ${cat.category}`);
      assert(cat.items.includes(val), `solution has unknown value '${val}' for category '${cat.category}'`);
    }
    const key = row[anchorCategory as string] as string;
    assert(!rowSeen.has(key), `duplicate anchor row in solution: ${key}`);
    rowSeen.add(key);
  }
}

export function validatePuzzle(input: unknown): Puzzle {
  assert(isObject(input), "Input must be object");
  const inputObj = input as Record<string, unknown>;
  const metadata = inputObj.metadata as Record<string, unknown>;
  const structure = inputObj.structure;
  const clues = inputObj.clues;

  assert(isObject(metadata), "metadata is required");
  assert(metadata.size === 3 || metadata.size === 4, "metadata.size must be 3 or 4");
  assert(typeof metadata.title === "string" && metadata.title.length > 0, "metadata.title is required");
  if (metadata.difficulty_target !== undefined) {
    assert(metadata.difficulty_target === "easy" || metadata.difficulty_target === "medium" || metadata.difficulty_target === "hard", "metadata.difficulty_target must be easy|medium|hard");
  }

  const size = metadata.size;
  validateStructureCommon(structure, size as 3 | 4);

  assert(Array.isArray(clues), "clues must be array");
  const clueArray = clues as unknown[];
  const index = buildEntityIndex(structure);
  const clueIds = new Set<number>();
  for (const clue of clueArray) {
    validateClue(clue, index, structure);
    const id = (clue as Clue).id;
    assert(!clueIds.has(id), `duplicate clue id: ${id}`);
    clueIds.add(id);
  }

  const puzzle = input as Puzzle;
  validateOptionalSolution(puzzle);
  return puzzle;
}
