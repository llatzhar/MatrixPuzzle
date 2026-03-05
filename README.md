# MatrixPuzzle

マトリックス論理パズルの生成 (`generate`) と解答 (`solve`) を行う CLI ツールです。

## Requirements

- Node.js 24+
- npm

## Setup

```bash
npm install
```

## Build

```bash
npm run build
```

## Test

```bash
npm test
```

## CLI Usage

このプロジェクトは JSON ファイル入出力で動作します。

### 1. 問題を生成する

入力: `config.json`  
出力: `out-puzzle.json`

```bash
npm run generate -- --in config.json --out out-puzzle.json
```

配布用に解答を除外したい場合:

```bash
npm run generate -- --in config.json --out out-puzzle.json --omit-solution
```

### 2. 問題を解く

入力: `puzzle.json`  
出力: `out-result.json`

```bash
npm run solve -- --in puzzle.json --out out-result.json
```

## Scripts

- `npm run build`: TypeScript をコンパイル
- `npm run start`: ビルド済み CLI を直接実行
- `npm run generate`: ビルド済み生成コマンドを実行
- `npm run solve`: ビルド済み解答コマンドを実行
- `npm test`: テストを実行

## Notes

- 出力ファイルは UTF-8 JSON です。
- PowerShell で日本語が文字化けして見える場合がありますが、JSON ファイル自体は UTF-8 として正常に保存されます。
