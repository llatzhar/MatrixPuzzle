# MatrixPuzzle 実装計画

作成日: 2026-03-05
対象仕様: `matrix_puzzle_spec.md`

## 1. 前提とゴール

### 1.1 合意済み前提

- 実装基盤: Node.js 22 + TypeScript
- I/O: UTF-8 JSON ファイルのみ
- 難易度評価: 同一入力で完全決定的
- 4x4 の `solver_exact` 目標性能: 1問あたり 30 秒以内
- `generate` は配布時の `solution` 除外オプションを持つ
- `clues.text` はテンプレート生成
- `order.distance`: 正の整数のみ許可（0/負数は入力エラー）
- `allow_assumption_required=false` の場合、hard 問題は再試行で除外
- `trace.description` は人間向け文字列のみ
- 異常時 JSON は共通形式: `status`, `error.code`, `error.message`
- seed 再現性: 同一 OS・同一 Node で保証

### 1.2 成果物

- CLI コマンド
  - `generate --in <config.json> --out <puzzle.json> [--omit-solution]`
  - `solve --in <puzzle.json> --out <result.json>`
- コアモジュール
  - `parser`, `solver_exact`, `solver_logic`, `generator`
- 自動テスト
  - 仕様 11章に対応した生成器/ソルバ試験

## 2. ディレクトリ設計

```text
src/
  cli/
    index.ts
    commands/
      generate.ts
      solve.ts
  core/
    model/
      types.ts
      error-codes.ts
    parser/
      schema.ts
      validate.ts
      io.ts
    solver-exact/
      constraints.ts
      backtrack.ts
      count-solutions.ts
    solver-logic/
      state.ts
      techniques/
        elimination.ts
        cross.ts
        assumption.ts
      trace.ts
      difficulty.ts
      solve.ts
    generator/
      rng.ts
      build-solution.ts
      clue-factory.ts
      clue-set-search.ts
      quality-filter.ts
      generate.ts
  shared/
    deterministic.ts
    json.ts
    combinatorics.ts

test/
  fixtures/
    solver/
    generator/
  unit/
  integration/
  e2e/

doc/
  plans/
    matrix-puzzle-implementation-plan.md
```

## 3. データモデル方針

- 内部ではカテゴリと要素を index ベースで保持し、高速化する。
- JSON 入出力時のみ文字列名へ変換する。
- `clues.logic` は discriminated union で実装する。
- `order` ヒントの `relation` は当面 `before` のみ許容し、将来拡張しやすい列挙型で定義する。

## 4. 実装フェーズ

### Phase 1: 土台構築（parser + 型 + エラー）

実装内容:
- TypeScript プロジェクト初期化（strict 有効）
- JSON schema / runtime validation（`zod` など）
- 共通エラーコードと異常時 JSON 出力ヘルパー
- CLI 引数パーサ（`commander` など）

完了条件:
- 不正入力で `INVALID_INPUT` を JSON に出力して非0終了
- 正常系で I/O の round-trip が通る

### Phase 2: `solver_exact` 実装

実装内容:
- 制約表現（pair/not/either/xor/order）を統一変換
- バックトラック探索 + 前向きチェック
- 解数カウント（0/1/2+ で早期打ち切りオプション）

性能対策:
- 変数選択は「候補最小優先」
- 制約伝播後に矛盾即時検出
- `solution_count > 1` で必要時は探索短絡

完了条件:
- 既知データセットで解数一致率 100%
- 4x4 の代表ケースで 30 秒以内

### Phase 3: `solver_logic` 実装

実装内容:
- 決定的な適用順でテクニック実行
  - `elimination` -> `cross` -> `assumption`
- 手順トレース収集
- 難易度判定集計

完了条件:
- 同一問題 100 回で `difficulty.level` と `max_technique` 一致率 100%
- `trace` がステップ順に再現可能

### Phase 4: `generator` 実装

実装内容:
- seed 付き RNG
- 完成解ランダム生成
- 完成解から候補ヒント生成
- ヒント集合探索（ランダム + ヒューリスティック）
- `solver_exact` で一意解検証
- `solver_logic` で難易度推定
- `allow_assumption_required=false` 時に hard を除外

完了条件:
- `max_attempts` 以内に生成成功
- 3x3 成功率 95%以上、4x4 成功率 80%以上（各100回）

### Phase 5: CLI 完成 + E2E

実装内容:
- `generate` / `solve` コマンド統合
- `--omit-solution` 実装（配布向け）
- 異常系 JSON をコマンド横断で統一

完了条件:
- 仕様例に沿った JSON を入出力
- E2E で正常/異常を確認

## 5. テスト計画

### 5.1 単体テスト

- parser: スキーマ境界値
- solver_exact: 各ヒント種の制約変換
- solver_logic: 各テクニック単独適用
- generator: seed 再現性、ヒント整合性

### 5.2 結合テスト

- generate -> solve の往復
- `allow_assumption_required` の分岐
- `order.distance` の入力検証

### 5.3 E2E / 性能

- CLI で 3x3/4x4 を連続実行
- 4x4 `solver_exact` 時間計測（p95 を監視）
- 生成成功率試験（仕様 11.1-B）

## 6. リスクと対策

- リスク: 4x4 探索時間の悪化
  - 対策: 早期打ち切り、候補最小選択、制約伝播強化
- リスク: 目標難易度を満たすヒント集合が見つからない
  - 対策: ヒント候補生成の多様化、探索戦略を2段階化
- リスク: `order/either/xor` の参照整合性不備
  - 対策: parser 段階でカテゴリ整合検証を厳格化

## 7. マイルストーン（目安）

- M1（2-3日）: parser + CLI 骨格 + エラー共通化
- M2（3-5日）: solver_exact + 解数テスト
- M3（3-4日）: solver_logic + 難易度再現テスト
- M4（4-6日）: generator + 成功率試験
- M5（1-2日）: E2E + ドキュメント整備

## 8. 受け入れ基準

- 仕様 5, 6, 7, 8, 9, 11, 12 を満たす
- 一意解保証が `solver_exact` で検証される
- 難易度判定が決定的に再現される
- 生成成功率がしきい値を満たす
- 異常時 JSON が共通フォーマットで出力される
