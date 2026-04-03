# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Slack 上で大喜利を遊べる Bot です。大喜利（日本の即興コメディ形式）を Slack ワークスペースで楽しめるようにするアプリケーション。

## アーキテクチャ

Firebase Functions ベースの単一アプリで、以下の構成です：

- **src/**: アプリケーションソースコード
  - Express.js を使用した REST API
  - Firebase Functions エントリポイント
  - OpenAI API を使用した AI 講評機能
  - リポジトリパターンとサービス層を採用したアーキテクチャ
- **src/generated/supabase.ts**: Supabase 型定義（`yarn generate-types` で再生成）
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
yarn serve

# リント実行
yarn lint

# リント修正
yarn lint:fix

# Supabase 型定義を再生成（supabase CLI が必要）
yarn generate-types
```

### テスト

```bash
yarn test
```

### デプロイ

```bash
# Firebase Functions へデプロイ
yarn deploy

# リリース
yarn release
```

### その他

```bash
# ビルド
yarn build

# 型チェック
yarn type-check
```

## データベースについて

PostgreSQL + Supabase（supabase-js）を直接利用しています：

- テーブル型定義: `src/generated/supabase.ts`
- 型の再生成: `yarn generate-types`（supabase CLI が必要）
- マイグレーションは Supabase ダッシュボードまたは supabase CLI で管理

## 環境設定

### 必要な環境変数

- Firebase プロジェクト設定
- Slack App の設定（Bot Token, App Token）
- Supabase 接続情報（SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY）
- OpenAI API キー

### 開発時の注意点

- API は Firebase Functions で動作するため、`yarn serve` で Firebase Emulator を起動する
- Node.js バージョンは 22.22.1 を使用（mise で管理）
