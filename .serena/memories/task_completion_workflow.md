# タスク完了時のワークフロー

## タスク完了後に実行すべきコマンド

### 必須チェック（順序重要）

1. **リント実行**

   ```bash
   yarn lint
   ```

2. **リント修正（エラーがある場合）**

   ```bash
   yarn lint:fix
   ```

3. **テスト実行（Bot パッケージに変更がある場合）**

   ```bash
   cd packages/slackbot
   yarn test
   ```

4. **ビルド確認（API パッケージに変更がある場合）**
   ```bash
   cd packages/api
   yarn build
   ```

### データベース関連の変更がある場合

```bash
# Prisma スキーマ生成
cd packages/api
yarn generate-schema

# マイグレーション実行
yarn migrate
```

### 注意事項

- **コミットはユーザーが明示的に要求した場合のみ実行**
- リントエラーやテストエラーがある場合は解決してから完了とする
- データベーススキーマの変更時は必ずマイグレーションを実行
- 型エラーがある場合は TypeScript コンパイルで確認

### 開発サーバー起動（動作確認時）

```bash
# API 確認
yarn dev:api

# Bot 確認
yarn dev:bot
```
