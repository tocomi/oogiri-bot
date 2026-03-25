# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Slack 上で大喜利を遊べる Bot です。大喜利（日本の即興コメディ形式）を Slack ワークスペースで楽しめるようにするアプリケーション。

## アーキテクチャ

このプロジェクトは pnpm workspaces を使ったモノレポ構成で、以下の 2 つのメインパッケージから構成されています：

### packages/api

- Firebase Functions ベースの API サーバー
- Express.js を使用した REST API
- Firestore（従来）と PostgreSQL（新）の両方をサポートするデュアルデータベース構成
- OpenAI API を使用した AI 講評機能
- リポジトリパターンとサービス層を採用したアーキテクチャ

### packages/slackbot

- Slack Bolt Framework を使用した Slack Bot
- Socket Mode で動作
- Slack のインタラクション（ボタン、モーダル等）を処理
- API パッケージの REST エンドポイントを呼び出してデータ操作

### データモデル

- **Team**: Slack チーム情報
- **Odai**: 大喜利のお題
- **Kotae**: お題への回答
- **Vote**: 回答への投票
- **Result**: 集計結果

## よく使用するコマンド

### 開発

```bash
# API サーバーの開発起動（Firebase Emulator）
pnpm dev:api

# Slack Bot の開発起動
pnpm dev:bot

# リント実行
pnpm lint

# リント修正
pnpm lint:fix

# データベースマイグレーション
pnpm migrate
```

### テスト

```bash
# Bot パッケージのテスト実行
cd packages/slackbot
pnpm test
```

### デプロイ

```bash
# API のデプロイ（Firebase Functions）
pnpm deploy:api

# Bot のデプロイ（Heroku - GitHub連携で自動）
pnpm deploy:bot

# リリース
pnpm release
```

### 各パッケージでの作業

#### API パッケージ (packages/api)

```bash
cd packages/api

# Firebase Emulator 起動
pnpm serve

# Prisma スキーマ生成
pnpm generate-schema

# ビルド
pnpm build

# デプロイ
pnpm deploy
```

#### Bot パッケージ (packages/slackbot)

```bash
cd packages/slackbot

# 開発モード（変更監視）
pnpm watch

# TypeScript コンパイル
pnpm tsc

# テスト実行
pnpm test
```

## データベース移行について

このプロジェクトは Firestore から PostgreSQL への移行中で、両方のデータベースをサポートしています：

- **Firestore**: 従来のデータストア（FirestoreRepositoryImpl）
- **PostgreSQL**: 新しいデータストア（PostgresRepositoryImpl）+ Prisma ORM

各エンティティ（Odai, Kotae, Vote）には両方のリポジトリ実装があり、サービス層で適切に切り替えて使用しています。

## 環境設定

### 必要な環境変数

- Firebase プロジェクト設定
- Slack App の設定（Bot Token, App Token）
- PostgreSQL データベース接続情報（DATABASE_URL, DIRECT_URL）
- OpenAI API キー

### 開発時の注意点

- API は Firebase Functions で動作するため、`firebase emulators:start` が必要
- Bot は Socket Mode で動作するため、インターネット接続が必要
- データベースマイグレーションは `pnpm migrate` で実行
- Node.js バージョンは 22.22.1 を使用（engines フィールドで管理）
