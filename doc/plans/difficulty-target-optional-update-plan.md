# difficulty_target 任意化 修正計画

作成日: 2026-03-05
対象仕様: `doc/spec/matrix_puzzle_spec.md`

## 1. 変更目的

- `generate` 入力の `metadata.difficulty_target` を任意化する。
- 未指定時は難易度フィルタを適用せず、品質基準（一意解、構文妥当、評価可能）を満たす問題を採用する。

## 2. 実装変更

### 2.1 型定義

対象: `src/core/model/types.ts`

- `Metadata.difficulty_target` を必須から任意へ変更。
  - 変更前: `difficulty_target: DifficultyLabel`
  - 変更後: `difficulty_target?: DifficultyLabel`

### 2.2 入力検証

対象: `src/core/parser/schema.ts`

- `metadata.difficulty_target` の検証を以下に変更。
  - 存在する場合のみ `easy|medium|hard` を許可。
  - 未指定は正常入力として受理。

### 2.3 生成ロジック

対象: `src/core/generator/generate.ts`

- `matchesTarget` の適用条件を変更。
  - `difficulty_target` 指定時: 従来どおり難易度一致を必須化。
  - 未指定時: 難易度一致チェックをスキップ。
- 出力 `metadata` は、入力に `difficulty_target` がない場合はそのまま未設定で返す。

## 3. テスト追加・更新

### 3.1 parser テスト

対象: `test/unit/parser.test.ts`

- 追加: `difficulty_target` 未指定でも `parseGenerateInput` が成功するテスト。
- 維持: 無効文字列（例: `"expert"`）は `INVALID_INPUT` になるテスト。

### 3.2 generator 結合テスト

対象: `test/integration/`

- 追加: `difficulty_target` 未指定で `generate` が成功し、`difficulty_estimated` が出力されるテスト。
- 追加: `difficulty_target=medium` 指定時に medium 以外が採用されないことを確認するテスト。

## 4. CLI/E2E 確認

- `config.json` から `difficulty_target` を外した入力ファイルを用意。
- `npm run generate -- --in <no-target-config> --out <out>` を実行。
- 出力 JSON の妥当性と `solution_count==1` を `solve` で確認。

## 5. 受け入れ基準

- `difficulty_target` 未指定の `generate` 入力が `INVALID_INPUT` にならない。
- 未指定時の生成が成功し、難易度に依存せず品質基準を満たす問題を出力する。
- 指定時の難易度フィルタ挙動（現行動作）が維持される。
- 既存テストが回帰しない。
