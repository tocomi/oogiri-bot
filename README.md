# oogiri-bot

Slack 上で大喜利を遊べる Bot です 🎍

## 構成

```txt
apps/
  functions/  # Firebase Functions の Slack Bot
  admin/      # 管理画面用 workspace（未実装）
```

## ローカル起動

`.env.local` の設定が必要（`.env.sample` 参照）

```shell
pnpm install
pnpm serve
```

## リリース

```shell
pnpm release
```

## デプロイ

`.env` の設定が必要（`.env.sample` 参照）

```shell
pnpm deploy
```
