# oogiri-bot

Slack 上で大喜利を遊べる Bot です 🎍

## ローカル起動

### API

firebase と .env の設定が必要

```shell
# firebase functions の emulator を起動
cd functions
yarn
yarn serve
```

### Bot

.env の設定が必要

```shell
yarn
yarn start
```

## リリース

```shell
yarn release
```

## デプロイ

### API

```shell
cd functions
yarn deploy
```

### Bot

GitHub と Heroku を連携しているので、main ブランチに push すると自動でデプロイされます。
