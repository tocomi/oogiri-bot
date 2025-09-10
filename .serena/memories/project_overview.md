# プロジェクト概要

## プロジェクト名
oogiri-bot

## 目的
Slack 上で大喜利を遊べる Bot です。大喜利（日本の即興コメディ形式）を Slack ワークスペースで楽しめるようにするアプリケーション。

## アーキテクチャ
yarn workspaces を使ったモノレポ構成で、以下の2つのメインパッケージから構成：

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

## データモデル
- **Team**: Slack チーム情報
- **Odai**: 大喜利のお題
- **Kotae**: お題への回答
- **Vote**: 回答への投票
- **Result**: 集計結果

## データベース移行状況
Firestore から PostgreSQL への移行中で、両方のデータベースをサポートしています：
- **Firestore**: 従来のデータストア（FirestoreRepositoryImpl）
- **PostgreSQL**: 新しいデータストア（PostgresRepositoryImpl）+ Prisma ORM

各エンティティ（Odai, Kotae, Vote）には両方のリポジトリ実装があり、サービス層で適切に切り替えて使用。