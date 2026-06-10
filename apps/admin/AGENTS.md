# AGENTS.md

This file provides guidance to Codex when working inside `apps/admin`.
The repository-level `AGENTS.md` still applies; this file adds admin-specific instructions.

## プロジェクト概要

`apps/admin` は Oogiri Bot の管理画面です。Next.js App Router を使った pnpm workspace パッケージで、Slack Bot 本体や DB スキーマは `apps/functions` 側にあります。

## 技術スタック

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Base UI
- oxlint / oxfmt

## ディレクトリ構成

- `src/app/`: App Router のページ、レイアウト、グローバル CSS
- `src/features/`: 機能単位の UI・ロジック
- `.next/`: Next.js のビルド出力。編集しない
- `node_modules/`: 依存関係。編集しない

## よく使用するコマンド

リポジトリルートから実行する場合：

```bash
pnpm admin:dev
pnpm admin:build
pnpm admin:type-check
pnpm admin:lint
pnpm admin:lint:fix
pnpm admin:format
pnpm admin:format:check
```

`apps/admin` 内から実行する場合：

```bash
pnpm dev
pnpm build
pnpm type-check
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
```

## 実装方針

- App Router の Server Component を基本にし、ブラウザ API や状態管理が必要な箇所だけ Client Component にする
- 管理画面なので、派手なランディングページではなく、情報を素早く読める密度と操作性を優先する
- 画面文言は日本語を基本にし、プロダクト名や技術名は既存表記に合わせる
- page は最低限の実装を起き、コンポーネントやロジックは機能単位で `src/features/<feature>/` に置く
- 共通化は実際に重複や責務の共有が見えてから行う。`src/features/shared/` に置く
- `.next/`, `tsconfig.tsbuildinfo`, `next-env.d.ts` など生成物を手編集しない
- 設計については `composition-patterns` スキルを活用する。

## UI / CSS の注意点

- Tailwind CSS のユーティリティを優先し、グローバル CSS は reset、テーマ変数、全体の土台に限定する
- 既存の落ち着いた管理画面トーンに合わせ、過度な装飾や巨大な hero 表現を避ける
- カードやパネルは情報のまとまりにだけ使い、カードの中にカードを重ねない
- レスポンシブ時にテキストや数値が重ならないよう、固定フォーマットの UI には安定した幅・高さ・折り返しを指定する
- ボタンやフォームを追加するときは、ラベル、フォーカス状態、キーボード操作、ARIA 属性を確認する
- デザインで活用するスキル
  - frontend-design
  - baseline-ui
  - web-design-guidelines

## データ連携

- DB スキーマは `apps/functions/src/db/schema.ts` が正であり、admin 側から直接スキーマを変更しない
- スキーマ変更が必要な場合は root の DB 手順に従い、Drizzle のマイグレーションを生成する
- Supabase の service role key など秘匿値を Client Component に渡さない
- 管理画面でサーバー側データ取得を追加する場合は、Server Component、Route Handler、Server Action のどこに責務を置くかを明確にする

## 検証

admin 変更後は影響範囲に応じて以下を実行する：

```bash
pnpm admin:type-check
pnpm admin:lint
pnpm admin:format
pnpm admin:build
```

UI を変更した場合は `http://localhost:3000` で主要な viewport でレイアウト崩れがないか確認する。
勝手に起動コマンドは実行せず、起動は人間に任せる。
