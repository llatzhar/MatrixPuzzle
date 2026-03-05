import test from "node:test";
import assert from "node:assert/strict";
import { parseGenerateInput } from "../../src/core/parser/validate.js";

test("parseGenerateInput validates size", () => {
  const raw = {
    metadata: {
      title: "x",
      size: 5,
      difficulty_target: "easy"
    },
    structure: [],
    generation: {
      allowed_clue_types: ["pair"],
      require_unique_solution: true,
      allow_assumption_required: true,
      max_attempts: 10
    }
  };

  assert.throws(() => parseGenerateInput(raw), /metadata.size must be 3 or 4/);
});
