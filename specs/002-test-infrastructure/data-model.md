# Test Data Model: テストインフラストラクチャ

**Feature**: テストインフラストラクチャの導入
**Date**: 2025-12-30
**Related**: [spec.md](./spec.md) | [plan.md](./plan.md)

## Overview

このドキュメントは、テスト実行時に使用されるデータモデルとフィクスチャの構造を定義します。本番環境のデータモデルとは分離され、テスト専用のデータベースまたはモックデータとして使用されます。

## Test Database Strategy

### 分離戦略

**選択**: スキーマ分離戦略（各テストスイートが独立したスキーマまたはテーブル接頭辞を使用）

**理由**:
- 完全なデータベース分離よりもリソース効率が良い
- 並列実行時の競合を完全に防止
- 単一のPostgreSQLインスタンスで管理可能

### スキーマ構造

```typescript
// テストスイート実行時のスキーマ識別子
interface TestSuiteSchema {
  prefix: string;        // 例: "test_suite_1_"
  createdAt: Date;       // スキーマ作成時刻
  cleanedUpAt?: Date;    // クリーンアップ時刻
}
```

## Test Entities

### TestUser

テスト用ユーザーエンティティ。本番のUserモデルと同じ構造を持つが、テスト専用のデータ。

```typescript
interface TestUser {
  id: string;              // cuid
  email?: string;          // 認証ユーザーの場合のみ
  passwordHash?: string;   // "test_password_123" のbcryptハッシュ
  nickname: string;        // テスト用ニックネーム
  isGuest: boolean;        // true: ゲスト, false: 認証ユーザー
  createdAt: Date;
  updatedAt: Date;
}

// フィクスチャ例
const guestUser: TestUser = {
  id: "test_guest_001",
  nickname: "テストゲスト",
  isGuest: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const authUser: TestUser = {
  id: "test_auth_001",
  email: "test@example.com",
  passwordHash: "$2a$10$...", // bcrypt hash of "test_password_123"
  nickname: "テスト認証ユーザー",
  isGuest: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### TestSession

テスト用セッションエンティティ。

```typescript
interface TestSession {
  id: string;                 // cuid
  name?: string;              // オプションのセッション名
  shareToken: string;         // 共有トークン（16文字）
  ownerToken: string;         // オーナートークン（32文字）
  ownerId: string;            // TestUser.id
  projectId?: string;         // オプションのプロジェクトID
  isRevealed: boolean;        // カード公開状態
  status: "ACTIVE" | "FINALIZED";
  finalEstimate?: number;     // 確定した見積もり（日数）
  createdAt: Date;
}

// フィクスチャ例
const activeSession: TestSession = {
  id: "test_session_001",
  name: "テストセッション",
  shareToken: "test_share_001",
  ownerToken: "test_owner_001",
  ownerId: "test_auth_001",
  isRevealed: false,
  status: "ACTIVE",
  createdAt: new Date(),
};
```

### TestEstimate

テスト用見積もりエンティティ。

```typescript
interface TestEstimate {
  id: string;              // cuid
  sessionId: string;       // TestSession.id
  userId: string;          // TestUser.id
  nickname: string;        // 参加者名
  value: number;           // 見積もり（日数）
  createdAt: Date;
  updatedAt: Date;
}

// フィクスチャ例
const estimate: TestEstimate = {
  id: "test_estimate_001",
  sessionId: "test_session_001",
  userId: "test_guest_001",
  nickname: "テストゲスト",
  value: 1.0,              // 1日
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

## Fixture Patterns

### ユーザーフィクスチャ

```typescript
// __tests__/fixtures/users.ts
export const testUsers = {
  guest: {
    id: "test_guest_001",
    nickname: "テストゲスト",
    isGuest: true,
  },
  authUser: {
    id: "test_auth_001",
    email: "test@example.com",
    passwordHash: "$2a$10$...",
    nickname: "テスト認証ユーザー",
    isGuest: false,
  },
  googleUser: {
    id: "test_google_001",
    email: "google@example.com",
    nickname: "Googleユーザー",
    isGuest: false,
  },
};
```

### セッションフィクスチャ

```typescript
// __tests__/fixtures/sessions.ts
export const testSessions = {
  active: {
    id: "test_session_001",
    name: "アクティブセッション",
    shareToken: "test_share_001",
    ownerToken: "test_owner_001",
    ownerId: "test_auth_001",
    isRevealed: false,
    status: "ACTIVE" as const,
  },
  revealed: {
    id: "test_session_002",
    name: "公開済みセッション",
    shareToken: "test_share_002",
    ownerToken: "test_owner_002",
    ownerId: "test_auth_001",
    isRevealed: true,
    status: "ACTIVE" as const,
  },
  finalized: {
    id: "test_session_003",
    name: "確定済みセッション",
    shareToken: "test_share_003",
    ownerToken: "test_owner_003",
    ownerId: "test_auth_001",
    isRevealed: true,
    status: "FINALIZED" as const,
    finalEstimate: 2.5,
  },
};
```

## Schema Validation

### マイグレーションテスト

```typescript
// __tests__/fixtures/schema-validator.ts
export async function validateSchema(prisma: PrismaClient, prefix: string) {
  // Prismaスキーマの整合性を検証
  const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name LIKE ${prefix + '%'}
  `;

  // 必須テーブルの存在確認
  const requiredTables = ['users', 'estimation_sessions', 'estimates'];
  const missingTables = requiredTables.filter(
    table => !tables.some(t => t.table_name === prefix + table)
  );

  if (missingTables.length > 0) {
    throw new Error(`Missing tables: ${missingTables.join(', ')}`);
  }

  return true;
}
```

## Data Setup & Cleanup

### セットアップパターン

```typescript
// __tests__/helpers/db-setup.ts
export async function setupTestDatabase(suiteId: string) {
  const prefix = `test_suite_${suiteId}_`;
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL,
      },
    },
  });

  // スキーマバリデーション
  await validateSchema(prisma, prefix);

  // テストデータのセットアップ
  await prisma.user.createMany({
    data: Object.values(testUsers).map(user => ({
      ...user,
      id: prefix + user.id,
    })),
  });

  return { prisma, prefix };
}
```

### クリーンアップパターン

```typescript
export async function cleanupTestDatabase(prisma: PrismaClient, prefix: string) {
  // すべてのテストデータを削除
  await prisma.estimate.deleteMany({
    where: { id: { startsWith: prefix } },
  });
  await prisma.estimationSession.deleteMany({
    where: { id: { startsWith: prefix } },
  });
  await prisma.user.deleteMany({
    where: { id: { startsWith: prefix } },
  });

  await prisma.$disconnect();
}
```

## Test Database Configuration

### 環境変数

```bash
# テスト専用データベース接続
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/estimate_poker_test"

# 並列実行時のスキーマ接頭辞
TEST_SUITE_PREFIX="test_suite_"
```

### タイムアウト設定

- **ユニットテスト**: 30秒
- **E2Eテスト**: 5分
- **DBセットアップ**: 10秒
- **DBクリーンアップ**: 10秒

## Validation Rules

テストデータは以下のバリデーションルールに従う：

1. **ユニーク制約**: `id`, `email`, `shareToken`, `ownerToken`は必ずユニーク
2. **外部キー整合性**: `ownerId`, `userId`, `sessionId`は有効なIDを参照
3. **型制約**: TypeScript strict modeに準拠
4. **値の範囲**: 見積もり値は0.125〜8.0日の範囲内
5. **状態遷移**: `status`は`ACTIVE` → `FINALIZED`の一方向のみ

## Migration Testing

Prismaマイグレーションのテストパターン：

```typescript
describe('Prisma migrations', () => {
  it('should apply all migrations successfully', async () => {
    const { prisma, prefix } = await setupTestDatabase('migration_test');

    // マイグレーション適用
    await prisma.$executeRaw`
      SELECT * FROM _prisma_migrations
      WHERE applied_steps_count = steps_to_apply
    `;

    // スキーマ検証
    await validateSchema(prisma, prefix);

    await cleanupTestDatabase(prisma, prefix);
  });
});
```

## Notes

- テストデータは各テスト実行前に自動セットアップ、実行後に自動クリーンアップ
- 並列実行時は各スイートが独立したスキーマ接頭辞を使用
- カバレッジレポートはテストデータを含まない
