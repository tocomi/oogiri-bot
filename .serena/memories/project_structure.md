# プロジェクト構造

## ルートディレクトリ構成
```
oogiri-bot/
├── packages/
│   ├── api/           # Firebase Functions API
│   └── slackbot/      # Slack Bot
├── .yarn/             # Yarn管理ファイル
├── .serena/           # Serena設定
├── .claude/           # Claude設定
├── package.json       # ワークスペース設定
├── CLAUDE.md          # Claudeへの指示書
└── README.md          # プロジェクト説明
```

## packages/api 構成
```
packages/api/src/
├── ai/                # AI講評機能
├── api/               # API関連
├── firebase/          # Firebase設定
├── ippon/             # IPPON機能
├── kotae/             # 回答機能
├── odai/              # お題機能
├── prisma/            # Prisma設定
├── slack/             # Slack連携
├── util/              # ユーティリティ
├── vote/              # 投票機能
├── config.ts          # 設定
├── const.ts           # 定数
└── index.ts           # エントリーポイント
```

## packages/slackbot 構成
```
packages/slackbot/src/
├── api/               # API呼び出し
├── ippon/             # IPPON機能
├── kotae/             # 回答処理
├── message/           # メッセージ処理
├── odai/              # お題処理
├── script/            # スクリプト
├── slack/             # Slack連携
├── task/              # タスク処理
├── util/              # ユーティリティ
├── vote/              # 投票処理
├── config.ts          # 設定
├── const.ts           # 定数
└── index.ts           # エントリーポイント
```

## 重要な設定ファイル
- `tsconfig.base.json` - TypeScript基底設定
- `.eslintrc.js` - ESLint設定
- `.prettierrc.js` - Prettier設定
- `firebase.json` - Firebase設定
- `jest.config.js` - Jest設定（Bot用）
- `.yarnrc.yml` - Yarn設定