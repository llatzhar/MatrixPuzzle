#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

OUT_DIR="puzzles"
mkdir -p "$OUT_DIR"

npm run build >/dev/null

for i in $(seq 1 100); do
  out_file=$(printf "%s/puzzle_%03d.json" "$OUT_DIR" "$i")
  npm run generate -- --in config.json --out "$out_file" --omit-solution >/dev/null
  echo "generated: $out_file"
done

echo "done: 100 puzzles in $OUT_DIR"
