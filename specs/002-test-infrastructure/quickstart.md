# Quickstart: テストインフラストラクチャ

**Feature**: テストインフラストラクチャの導入
**Date**: 2025-12-30
**Related**: [spec.md](./spec.md) | [plan.md](./plan.md) | [research.md](./research.md)

## 概要

このガイドは、Estimate Poker Nextプロジェクトでテストを実行するためのクイックスタートガイドです。

## 前提条件

- Node.js 20.x以上
- PostgreSQL 16以上（テスト専用データベース）
- npm依存関係がインストール済み

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. テスト専用データベースの作成

```bash
# PostgreSQLに接続
psql -U postgres

# テストDBを作成
CREATE DATABASE estimate_poker_test;
\q
```

### 3. 環境変数の設定

`.env.test.local`ファイルを作成：

```bash
# テスト専用データベース
TEST_DATABASE_URL="postgresql://postgres:password@localhost:5432/estimate_poker_test"

# NextAuth設定（テスト用）
NEXTAUTH_SECRET="test-secret-key-for-testing"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. テストデータベースのマイグレーション

```bash
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
```

## テストの実行

### ユニットテスト（Vitest）

```bash
# すべてのユニットテストを実行
npm run test:unit

# watchモード（ファイル変更時に自動再実行）
npm run test:watch

# カバレッジレポート付き
npm run test:coverage

# UI モード（ブラウザでデバッグ）
npm run test:ui

# 特定のテストファイルのみ実行
npx vitest run __tests__/unit/lib/utils.test.ts
```

**実装済みテスト**:
- トークン生成関数（utils.test.ts）
- マイグレーションテスト（migrations.test.ts）
- PokerCard コンポーネント（8テスト）
- CardSelector コンポーネント（12テスト）
- ParticipantList コンポーネント（11テスト）
- EstimateResult コンポーネント（15テスト）
- LoadingSpinner コンポーネント（6テスト）

### E2Eテスト（Playwright）

```bash
# すべてのE2Eテストを実行
npm run test:e2e

# 特定のテストファイルのみ
npx playwright test __tests__/e2e/guest-login.spec.ts

# ヘッドレスモードをオフ（ブラウザを表示）
npx playwright test --headed

# デバッグモード
npx playwright test --debug

# UIモード（インタラクティブ）
npx playwright test --ui
```

**実装済みE2Eテスト**:
- ゲストログインフロー（3テスト）
- 認証ログインフロー（4テスト）
- セッション作成・見積もりフロー（6テスト）

### すべてのテストを実行

```bash
# ユニットテストのみ
npm test

# ユニットテスト + E2Eテスト
npm run test:unit && npm run test:e2e
```

## カバレッジレポートの確認

```bash
# カバレッジレポート生成
npm run test:coverage

# HTMLレポートを開く
open coverage/index.html
```

カバレッジ目標: 60%以上（lines, functions, branches, statements）

## CI/CDでの実行

### GitHub Actionsワークフロー

プルリクエスト作成時に自動実行：

1. Lint & Type Check
2. Unit Tests（カバレッジ付き）
3. E2E Tests（4シャード並列実行）

### ローカルでCI環境を再現

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e
```

## トラブルシューティング

### テストが失敗する

1. **データベース接続エラー**
   ```bash
   # PostgreSQLが起動しているか確認
   pg_isready

   # データベースが存在するか確認
   psql -U postgres -l | grep estimate_poker_test
   ```

2. **Prisma Clientが古い**
   ```bash
   npx prisma generate
   ```

3. **ポート3000が使用中**
   ```bash
   # 使用中のプロセスを確認
   lsof -i :3000

   # プロセスを終了
   kill -9 <PID>
   ```

### E2Eテストがタイムアウトする

```bash
# タイムアウト時間を延長
npx playwright test --timeout=60000
```

### カバレッジが60%未満

```bash
# カバレッジレポートを確認
open coverage/index.html

# テスト対象外のファイルを確認
cat vitest.config.ts
```

## 次のステップ

- [Test Patterns](./contracts/test-patterns.md) - テストパターンとベストプラクティス
- [Data Model](./data-model.md) - テストデータモデル
- [Research](./research.md) - 技術選定の詳細

## コマンドリファレンス

| コマンド | 説明 |
|---------|------|
| `npm run test` | すべてのテストを実行 |
| `npm run test:unit` | ユニットテストのみ |
| `npm run test:e2e` | E2Eテストのみ |
| `npm run test:coverage` | カバレッジレポート生成 |
| `npm run test:watch` | ファイル変更時に自動再実行 |
| `npm run test:ui` | Vitest UI モード |
| `npx playwright test --debug` | Playwright デバッグモード |
| `npx playwright show-trace` | トレース再生 |
