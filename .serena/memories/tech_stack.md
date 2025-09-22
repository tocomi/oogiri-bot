# 技術スタック

## 言語・ランタイム

- Node.js 20.19.5 (Volta で管理)
- TypeScript 4.3.4

## フレームワーク・ライブラリ

- **API**: Firebase Functions, Express.js
- **Bot**: Slack Bolt Framework
- **データベース**:
  - Firestore (従来)
  - PostgreSQL + Prisma ORM (新)
- **AI**: OpenAI API

## 開発ツール

- **パッケージマネージャー**: yarn 4.5.0 (workspaces)
- **トランスパイラー**: TypeScript
- **リンター**: ESLint + Prettier
- **テスト**: Jest (ts-jest)
- **監視ツール**: tsc-watch

## インフラ・デプロイ

- **API**: Firebase Functions
- **Bot**: Heroku (GitHub 連携で自動デプロイ)
- **データベース**: PostgreSQL

## その他の依存関係

- cors, dotenv, uuid, dayjs, emoji-regex
- Firebase Admin SDK
- Slack Web API
