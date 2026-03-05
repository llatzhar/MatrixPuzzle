export type DifficultyLabel = "easy" | "medium" | "hard";
export type Technique = "elimination" | "cross" | "assumption";
export type ClueType = "pair" | "not" | "either" | "xor" | "order";

export type Category = {
  category: string;
  items: string[];
  ordered: boolean;
};

export type Metadata = {
  title: string;
  size: 3 | 4;
  difficulty_target?: DifficultyLabel;
  difficulty_estimated?: DifficultyLabel;
  seed?: number;
};

export type GenerationConfig = {
  allowed_clue_types: ClueType[];
  require_unique_solution: boolean;
  allow_assumption_required: boolean;
  max_attempts: number;
};

export type PairLogic = {
  type: "pair";
  subjects: [string, string];
};

export type NotLogic = {
  type: "not";
  subjects: [string, string];
};

export type EitherLogic = {
  type: "either";
  subjects: [string, string, string];
};

export type XorLogic = {
  type: "xor";
  subjects: [string, string, string];
};

export type OrderLogic = {
  type: "order";
  subjects: [string, string];
  order: {
    category: string;
    relation: "before";
    distance: number | null;
  };
};

export type ClueLogic = PairLogic | NotLogic | EitherLogic | XorLogic | OrderLogic;

export type Clue = {
  id: number;
  text: string;
  logic: ClueLogic;
};

export type SolutionRow = Record<string, string>;

export type GenerateInput = {
  metadata: Metadata;
  structure: Category[];
  generation: GenerationConfig;
};

export type Puzzle = {
  metadata: Metadata;
  structure: Category[];
  clues: Clue[];
  solution?: SolutionRow[];
};

export type SolveTraceStep = {
  step: number;
  technique: Technique;
  description: string;
};

export type SolveResult = {
  status: "solved" | "unsolved" | "error";
  unique_solution: boolean;
  solution_count: number;
  difficulty: {
    level: 1 | 2 | 3;
    label: DifficultyLabel;
    max_technique: Technique;
    technique_usage: Record<Technique, number>;
  };
  trace: SolveTraceStep[];
  solution: SolutionRow[];
};
