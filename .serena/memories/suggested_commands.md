# 推奨コマンド一覧

## 開発コマンド

```bash
# API サーバーの開発起動（Firebase Emulator）
yarn dev:api

# Slack Bot の開発起動
yarn dev:bot

# 両方のパッケージでリント実行
yarn lint

# 両方のパッケージでリント修正
yarn lint:fix

# データベースマイグレーション
yarn migrate
```

## テストコマンド

```bash
# Bot パッケージのテスト実行
cd packages/slackbot
yarn test
```

## デプロイコマンド

```bash
# API のデプロイ（Firebase Functions）
yarn deploy:api

# Bot のデプロイ（Heroku - GitHub連携で自動）
yarn deploy:bot

# リリース
yarn release
```

## 各パッケージでの作業

### API パッケージ (packages/api)

```bash
cd packages/api

# Firebase Emulator 起動
yarn serve

# Prisma スキーマ生成
yarn generate-schema

# ビルド
yarn build

# デプロイ
yarn deploy

# リント
yarn lint
yarn lint:fix
```

### Bot パッケージ (packages/slackbot)

```bash
cd packages/slackbot

# 開発モード（変更監視）
yarn watch

# TypeScript コンパイル
yarn tsc

# テスト実行
yarn test

# リント
yarn lint
yarn lint:fix
```

## システムユーティリティ (Darwin)

- `git` - /opt/homebrew/bin/git
- `ls` - /bin/ls
- `cd` - shell built-in
- `grep` - /usr/bin/grep
- `find` - /usr/bin/find
