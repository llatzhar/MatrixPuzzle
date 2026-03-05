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

test("parseGenerateInput accepts missing difficulty_target", () => {
  const raw = {
    metadata: {
      title: "x",
      size: 3
    },
    structure: [
      {
        category: "名前",
        items: ["アリス", "ボブ", "チャーリー"],
        ordered: false
      },
      {
        category: "飲み物",
        items: ["紅茶", "牛乳", "コーラ"],
        ordered: false
      },
      {
        category: "順位",
        items: ["1位", "2位", "3位"],
        ordered: true
      }
    ],
    generation: {
      allowed_clue_types: ["pair", "not", "either", "xor", "order"],
      require_unique_solution: true,
      allow_assumption_required: true,
      max_attempts: 10
    }
  };

  const parsed = parseGenerateInput(raw);
  assert.equal(parsed.metadata.difficulty_target, undefined);
});

test("parseGenerateInput rejects invalid difficulty_target", () => {
  const raw = {
    metadata: {
      title: "x",
      size: 3,
      difficulty_target: "expert"
    },
    structure: [
      {
        category: "名前",
        items: ["アリス", "ボブ", "チャーリー"],
        ordered: false
      },
      {
        category: "飲み物",
        items: ["紅茶", "牛乳", "コーラ"],
        ordered: false
      },
      {
        category: "順位",
        items: ["1位", "2位", "3位"],
        ordered: true
      }
    ],
    generation: {
      allowed_clue_types: ["pair", "not"],
      require_unique_solution: true,
      allow_assumption_required: true,
      max_attempts: 10
    }
  };

  assert.throws(() => parseGenerateInput(raw), /metadata.difficulty_target must be easy\|medium\|hard/);
});
