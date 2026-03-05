# マトリックス論理パズル 生成器・ソルバ仕様書

## 1. 目的

本仕様書は、マトリックス論理パズル（カテゴリ対応表タイプ）を対象に、以下を満たす CLI アプリケーションの要件を定義する。

- 問題生成（Generator）
- 問題解答（Solver）
- 一意解保証（完全探索ベース）
- 難易度判定（推論テクニック階層ベース）

## 2. スコープ

### 2.1 対象

- パズル種別: マトリックス論理パズルのみ
- 問題サイズ: 3x3, 4x4
  - 3x3: 3カテゴリ × 各3要素
  - 4x4: 4カテゴリ × 各4要素
- ヒント種: `pair`, `not`, `either`, `xor`, `order`
- インターフェース: CLI のみ
- I/O: UTF-8 JSON ファイルのみ（標準入出力は使用しない）

### 2.2 非対象

- 数独、お絵かきロジック、その他パズル種
- GUI/Web UI
- 多言語自然文生成の品質最適化

## 3. 用語

- **エンティティ**: 各カテゴリに属する要素（例: 名前カテゴリの「アリス」）
- **割当**: 各エンティティ間の 1 対 1 対応
- **一意解**: 条件を満たす解がちょうど 1 つ
- **論理解法ソルバ**: 人間相当の推論規則で解くソルバ
- **完全探索ソルバ**: バックトラック探索で全解数を数えるソルバ

## 4. システム構成

以下の 4 モジュール構成とする。

1. `parser`: JSON 入出力、スキーマ検証
2. `solver_logic`: 論理解法（難易度判定用）
3. `solver_exact`: 完全探索（解数検証用）
4. `generator`: 解答生成、ヒント生成、品質フィルタ

## 5. CLI 仕様

## 5.1 コマンド

- `generate --in <config.json> --out <puzzle.json>`
- `solve --in <puzzle.json> --out <result.json>`

## 5.2 共通仕様

- 文字コード: UTF-8
- 正常終了: exit code `0`
- 異常終了: 非 `0`（入力不正、生成失敗、解なし等）
- 標準出力・標準入力は仕様対象外（ログ用途を除く）

## 6. JSON データ仕様

## 6.1 生成入力（`generate` 入力）

```json
{
  "metadata": {
    "title": "string",
    "size": 3,
    "difficulty_target": "easy",
    "seed": 12345
  },
  "structure": [
    { "category": "名前", "items": ["アリス", "ボブ", "チャーリー"], "ordered": false },
    { "category": "フルーツ", "items": ["リンゴ", "バナナ", "メロン"], "ordered": false },
    { "category": "飲み物", "items": ["牛乳", "紅茶", "コーラ"], "ordered": false }
  ],
  "generation": {
    "allowed_clue_types": ["pair", "not", "either", "xor", "order"],
    "require_unique_solution": true,
    "allow_assumption_required": true,
    "max_attempts": 1000
  }
}
```

### 制約

- `size` は `3` または `4`
- カテゴリ数 = `size`、各カテゴリ要素数 = `size`
- `seed` は任意（指定時は再現可能な生成結果を優先）
- `order` ヒントを使う場合、`ordered: true` のカテゴリを少なくとも 1 つ含むこと

## 6.2 生成出力（`generate` 出力 / `solve` 入力）

```json
{
  "metadata": {
    "title": "放課後のフルーツおやつ",
    "size": 3,
    "difficulty_target": "easy",
    "difficulty_estimated": "medium",
    "seed": 12345
  },
  "structure": [
    { "category": "名前", "items": ["アリス", "ボブ", "チャーリー"], "ordered": false },
    { "category": "フルーツ", "items": ["リンゴ", "バナナ", "メロン"], "ordered": false },
    { "category": "飲み物", "items": ["牛乳", "紅茶", "コーラ"], "ordered": false }
  ],
  "clues": [
    { "id": 1, "text": "ボブは紅茶を飲んでいる。", "logic": { "type": "pair", "subjects": ["ボブ", "紅茶"] } },
    { "id": 2, "text": "アリスはバナナではない。", "logic": { "type": "not", "subjects": ["アリス", "バナナ"] } }
  ],
  "solution": [
    { "名前": "アリス", "フルーツ": "メロン", "飲み物": "コーラ" },
    { "名前": "ボブ", "フルーツ": "リンゴ", "飲み物": "紅茶" },
    { "名前": "チャーリー", "フルーツ": "バナナ", "飲み物": "牛乳" }
  ]
}
```

## 6.3 解答出力（`solve` 出力）

```json
{
  "status": "solved",
  "unique_solution": true,
  "solution_count": 1,
  "difficulty": {
    "level": 2,
    "label": "medium",
    "max_technique": "cross",
    "technique_usage": {
      "elimination": 12,
      "cross": 4,
      "assumption": 0
    }
  },
  "trace": [
    { "step": 1, "technique": "elimination", "description": "..." },
    { "step": 2, "technique": "cross", "description": "..." }
  ],
  "solution": [
    { "名前": "アリス", "フルーツ": "メロン", "飲み物": "コーラ" }
  ]
}
```

## 7. ヒント種の論理仕様

全ヒントは `logic.type` を必須とし、`subjects` は参照先カテゴリの整合性を満たすこと。

1. `pair`
   - 意味: `A = B`
   - 例: 「ボブは紅茶」

2. `not`
   - 意味: `A ≠ B`
   - 例: 「アリスはバナナではない」

3. `either`
   - 意味: `A ∈ {B, C}`
   - 追加条件: `B`, `C` は同一カテゴリで相異なる要素

4. `xor`
   - 意味: `A` は `B`, `C` のどちらか一方（排他的）
   - `either` + 「両方不可」を明示したものとして扱う

5. `order`
   - 意味: 順序カテゴリ上での大小関係
   - 形式例:
     ```json
     {
       "type": "order",
       "subjects": ["アリス", "ボブ"],
       "order": { "category": "順位", "relation": "before", "distance": null }
     }
     ```
   - 解釈: `value(アリス, 順位) < value(ボブ, 順位)`
   - `distance` 指定時は差分制約（例: ちょうど 1 つ前）

## 8. ソルバ仕様

## 8.1 目的

- 問題を解く
- 難易度を判定する
- 一意解判定のための解数を返す

## 8.2 二系統ソルバ

1. **論理解法ソルバ**（`solver_logic`）
   - 人間相当の規則適用
   - 適用順を固定して再現性を確保
   - 解法トレース出力

2. **完全探索ソルバ**（`solver_exact`）
   - バックトラックで全解数を計数
   - `solution_count == 1` を一意解と判定

## 8.3 難易度レベル定義

- レベル1（easy）: `elimination` のみで解ける
- レベル2（medium）: `cross` が必要（`assumption` 不要）
- レベル3（hard）: `assumption` が必要

### 推論テクニック定義

- `elimination`: 直接否定・確定からの候補削減
- `cross`: 複数制約の交差による確定
- `assumption`: 仮定→矛盾検出→棄却（背理法）

## 9. 生成器仕様

## 9.1 目的

- 3x3/4x4 の妥当な問題を生成
- 一意解を保証
- 目標難易度帯に近い問題を選別
- 仮定が必要な問題（上級）も生成可能

## 9.2 生成フロー

1. 完成解（全カテゴリの 1 対 1 対応）を生成
2. 完成解から候補ヒントを大量生成（指定ヒント種）
3. ヒント集合を構成（ランダム/ヒューリスティック）
4. 完全探索ソルバで `solution_count` を検証
5. 一意解なら論理解法ソルバで難易度評価
6. 目標条件を満たしたら採用、満たさなければ再試行

## 9.3 品質基準（必須）

- 一意解保証: `solution_count == 1`
- 最小ヒント（極小性）: 必須要件ではない
- 生成試行上限: `max_attempts` 内で終了

## 9.4 乱数シード

- `seed` は任意入力
- 未指定時は非決定的生成を許容
- 指定時は同一実装・同一設定で再現可能な結果を目標とする

## 10. 面白さ・拡張指標（将来追加）

難易度主指標はテクニック階層だが、以下を拡張指標として追加可能とする。

- 連鎖長（1手後の連続確定数）
- 仮定深さ（分岐深度）
- ヒント情報量（過剰/不足の度合い）

## 11. テスト仕様

本章では生成器テストとソルバテストを分離して定義する。

## 11.1 生成器テスト

### A. 一意解検証テスト

- 対象: 生成結果全件
- 方法: `solver_exact` で `solution_count` を計測
- 合格条件: すべて `solution_count == 1`

### B. 生成成功率テスト

- 試行数: 各サイズ 100 回
- 合格基準:
  - 3x3: 成功率 95%以上
  - 4x4: 成功率 80%以上
- 成功定義: `max_attempts` 内に「一意解 + 構文妥当 + 難易度評価可能」な問題を出力

### C. 出力整合性テスト

- JSON スキーマ妥当性
- `structure` と `solution` のカテゴリ整合性
- `clues` 参照先の実在確認

## 11.2 ソルバテスト

### A. 一意解判定テスト

- 既知データセット（単一解/複数解/解なし）で `solution_count` を検証
- 合格条件: 正解数の一致率 100%

### B. 難易度判定再現性テスト

- 同一問題を複数回実行し、以下が一致すること
  - `difficulty.level`
  - `difficulty.max_technique`
- 推奨: 100 回実行で一致率 100%

### C. テクニック適用妥当性テスト

- レベル別の基準問題を用意し、期待テクニックが出現すること
  - easy 問題: `assumption == 0`
  - medium 問題: `cross > 0`, `assumption == 0`
  - hard 問題: `assumption > 0`

## 12. エラーハンドリング

- 入力 JSON 不正: `INVALID_INPUT`
- 解なし: `UNSAT`
- 複数解: `NON_UNIQUE`
- 生成失敗（試行上限到達）: `GENERATION_FAILED`
- 内部例外: `INTERNAL_ERROR`

エラー時も JSON ファイルに結果を書き出す実装を推奨する。

## 13. 実装優先順位

1. `solver_exact`（一意解判定の土台）
2. `solver_logic`（難易度判定）
3. `generator`（問題生成）
4. テスト自動化（生成器/ソルバ）

この順序により、生成結果の妥当性を早期に担保できる。