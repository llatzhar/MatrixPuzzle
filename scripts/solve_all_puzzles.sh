#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

IN_DIR="puzzles"
OUT_DIR="puzzles/solved"
mkdir -p "$OUT_DIR"

npm run build >/dev/null

count=0
for in_file in "$IN_DIR"/puzzle_*.json; do
  if [ ! -e "$in_file" ]; then
    echo "no puzzle files found in $IN_DIR"
    exit 1
  fi

  base_name="$(basename "$in_file" .json)"
  out_file="$OUT_DIR/${base_name}_result.json"

  npm run solve -- --in "$in_file" --out "$out_file" >/dev/null
  echo "solved: $in_file -> $out_file"
  count=$((count + 1))
done

echo "done: solved $count puzzles into $OUT_DIR"
