# oogiri-bot

Slack 上で大喜利を遊べる Bot です 🎍

## 構成

```txt
apps/
  functions/  # Firebase Functions の Slack Bot
  admin/      # 管理画面用 workspace（未実装）
```

## ローカル起動

`.env.local` の設定が必要（`apps/functions/.env.sample` 参照）

```shell
pnpm install
pnpm serve
```

### Slack Bot だけを Socket Mode で起動する

開発用ワークスペースの Socket Mode App を使い、公開 URL なしで Slack から操作を試せる。
`.env.local` に、その App の `SLACK_BOT_TOKEN` と `SLACK_APP_TOKEN`（App-Level Token、`connections:write`）を設定する。

```shell
pnpm dev:socket
```

REST API と定期実行は含まない。REST API も使うときは `pnpm serve` を並べて起動する。

## リリース

```shell
pnpm release
```

## デプロイ

`.env` の設定が必要（`apps/functions/.env.sample` 参照）

```shell
pnpm deploy
```
