# コードスタイル・規約

## ESLint 設定

- **ベース**: eslint:recommended
- **TypeScript**: @typescript-eslint/recommended

## 主要なルール

- **関数の戻り値の型注釈**: OFF（明示的な型注釈は必須ではない）
- **未使用の import**: エラーとして扱う
- **未使用の変数**: 警告として扱う（\_で始まる変数は除外）
- **import 順序**: アルファベット順（builtin → external → internal）

## アーキテクチャパターン

- **Repository パターン**: データアクセス層の抽象化
- **Service パターン**: ビジネスロジック層
- **インターフェース駆動**: Repository と Service にインターフェースを定義
- **依存性注入**: コンストラクタでの依存関係注入

## 命名規則

- **クラス**: PascalCase（例: `OdaiServiceImpl`）
- **インターフェース**: PascalCase（例: `OdaiService`）
- **変数・関数**: camelCase
- **定数**: UPPER_SNAKE_CASE
