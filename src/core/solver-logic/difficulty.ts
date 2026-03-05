import type { DifficultyLabel, Technique } from "../model/types.js";

export function levelFromUsage(usage: Record<Technique, number>): {
  level: 1 | 2 | 3;
  label: DifficultyLabel;
  max_technique: Technique;
} {
  if (usage.assumption > 0) {
    return { level: 3, label: "hard", max_technique: "assumption" };
  }
  if (usage.cross > 0) {
    return { level: 2, label: "medium", max_technique: "cross" };
  }
  return { level: 1, label: "easy", max_technique: "elimination" };
}
