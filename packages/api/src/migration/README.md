# Firestore to PostgreSQL Migration

このディレクトリには、FirestoreからPostgreSQLへのデータ移行ツールが含まれています。

## ファイル構成

- `migrate-firestore-to-postgres.ts` - メインの移行ロジック
- `data-fetcher.ts` - Firestoreからのデータ取得
- `data-transformer.ts` - データ変換とバリデーション
- `firebase-config.ts` - 独立したFirebase設定（マイグレーション専用）
- `run-migration.ts` - コマンドライン実行スクリプト
- `README.md` - このファイル

## セットアップ（重要）

### 1. Firebase認証情報の取得

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択 → 設定（⚙️）→ プロジェクトの設定
3. 「サービス アカウント」タブをクリック
4. 「新しい秘密鍵の生成」をクリック
5. JSONファイルをダウンロード

### 2. 環境変数の設定

```bash
# packages/api ディレクトリで実行
cd packages/api
cp .env.sample .env
```

`.env` ファイルを編集し、ダウンロードしたJSONファイルから以下の値をコピー：

```bash
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n実際のプライベートキー\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

**⚠️ 重要な注意事項：**
- `FIREBASE_PRIVATE_KEY` は改行文字を `\n` でエスケープする必要があります
- 全体をダブルクォートで囲んでください
- `.env` ファイルは絶対にGitにコミットしないでください

### 3. 依存関係の確認

```bash
# 必要なパッケージがインストールされているか確認
yarn install
```

## 使用方法

### 1. データ取得と分析（安全）

```bash
# API パッケージディレクトリに移動
cd packages/api

# TypeScript のビルド
yarn build

# Firestore からデータを取得してログを生成（読み取り専用）
npx ts-node ./src/migration/run-migration.ts fetch
```

このコマンドは以下を実行します：
- Firestoreからすべてのデータを取得
- PostgreSQL形式に変換
- データの整合性を検証
- 結果をJSONファイルとして出力

### 2. ログファイルの確認

生成されたログファイルは `packages/api/migration-logs/` に保存されます：

- `{timestamp}_firestore-raw-data.json` - Firestoreから取得した生データ
- `{timestamp}_postgres-transformed-data.json` - PostgreSQL用に変換されたデータ
- `{timestamp}_validation-result.json` - データ検証結果

### 3. 実際の移行実行（未実装）

```bash
# ⚠️ 現在は未実装 - 安全のため
node lib/migration/run-migration.js full
```

## データ構造の変換

### Firestore → PostgreSQL マッピング

| Firestore | PostgreSQL |
|-----------|------------|
| `team/{teamId}` | `Team.id` |
| `team/{teamId}/odai/{odaiId}` | `Odai.id`, `Odai.teamId` |
| `team/{teamId}/odai/{odaiId}/kotae/{kotaeId}` | `Kotae.id`, `Kotae.odaiId` |
| `team/{teamId}/odai/{odaiId}/vote/{voteId}` | `Vote.id`, `Vote.odaiId`, `Vote.kotaeId` |

### 重要な変換処理

1. **Timestamp変換**: Firestore Timestamp → JavaScript Date
2. **Vote構造の統合**: Firestoreでは2箇所に保存されているVoteを1箇所に統合
3. **Result生成**: 投票データから結果データを自動生成
4. **NULL値処理**: 空文字列をNULLに変換（imageUrlなど）

## 安全性について

このツールは以下の安全策を実装しています：

1. **読み取り専用モード**: デフォルトはデータ取得のみ
2. **詳細ログ**: すべての操作をJSONファイルに記録
3. **データ検証**: 移行前の整合性チェック
4. **段階的実行**: フェッチ→検証→移行の段階的処理

## トラブルシューティング

### Firebase認証エラー
```
Error: Unable to detect a Project Id in the current environment
```
- `.env` ファイルが `packages/api` ディレクトリに存在するか確認
- `FIREBASE_PROJECT_ID` が正しく設定されているか確認
- `FIREBASE_PRIVATE_KEY` の改行エスケープが正しいか確認

### Firebase設定エラー
```
Error: Firebase configuration is missing
```
- `.env` ファイルで以下の変数が設定されているか確認：
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_PRIVATE_KEY`
  - `FIREBASE_CLIENT_EMAIL`

### PostgreSQL接続エラー
```
Error: Can't reach database server
```
- `DATABASE_URL` が正しく設定されているか確認
- PostgreSQLサーバーが起動しているか確認

### メモリ不足エラー
```
Error: JavaScript heap out of memory
```
- Node.jsのメモリ制限を増やす: `node --max-old-space-size=4096`
- データを分割して処理する（未実装）

## 開発者向け情報

### 新しい移行ロジックの追加

1. `data-fetcher.ts` にフェッチロジックを追加
2. `data-transformer.ts` に変換ロジックを追加
3. `migrate-firestore-to-postgres.ts` にインサートロジックを追加

### テスト実行

```bash
# TypeScript チェック
yarn tsc --noEmit

# リント
yarn lint
```

### ログレベル調整

ログの詳細度を調整するには、各ファイルの `console.log` を変更してください。