# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## プロジェクト概要

Slack 上で大喜利を遊べる Bot です。大喜利（日本の即興コメディ形式）を Slack ワークスペースで楽しめるようにするアプリケーション。

## アーキテクチャ

Firebase Functions ベースの単一アプリで、以下の構成です：

- **src/**: アプリケーションソースコード
  - Express.js を使用した REST API
  - Firebase Functions エントリポイント
  - OpenAI API を使用した AI 講評機能
  - リポジトリパターンとサービス層を採用したアーキテクチャ
- **lib/**: TypeScript コンパイル出力（管理対象外）

### データモデル

- **Team**: Slack チーム情報
- **Odai**: 大喜利のお題
- **Kotae**: お題への回答
- **Vote**: 回答への投票
- **Result**: 集計結果

## よく使用するコマンド

### 開発

```bash
# Firebase Emulator で開発起動
pnpm serve

# リント実行
pnpm lint

# リント修正
pnpm lint:fix
```

### テスト

```bash
pnpm test
```

### デプロイ

```bash
# Firebase Functions へデプロイ
pnpm deploy

# リリース
pnpm release
```

### その他

```bash
# ビルド
pnpm build

# 型チェック
pnpm type-check
```

## データベースについて

PostgreSQL + Supabase を Drizzle ORM 経由で利用しています：

- スキーマ定義: `src/db/schema.ts`
- マイグレーションファイル: `drizzle/`（リポジトリ管理対象）
- **スキーマを変更したときは必ず以下の手順で管理する**

```bash
# 1. src/db/schema.ts を編集

# 2. マイグレーションファイルを生成
pnpm migrate:generate

# 3. 本番 DB に適用
pnpm migrate
```

- Supabase ダッシュボードや supabase CLI でスキーマを直接変更しない（Drizzle と競合する）

## 環境設定

### 必要な環境変数

- Firebase プロジェクト設定
- Slack App の設定（Bot Token, App Token）
- Supabase 接続情報（SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY）
- OpenAI API キー

### 開発時の注意点

- API は Firebase Functions で動作するため、`pnpm serve` で Firebase Emulator を起動する
- Node.js バージョンは 22.22.1 を使用（mise で管理）
