# Test Patterns: テストインフラストラクチャ

**Feature**: テストインフラストラクチャの導入
**Date**: 2025-12-30
**Related**: [spec.md](../spec.md) | [plan.md](../plan.md) | [research.md](../research.md)

## Overview

このドキュメントは、Estimate Poker Nextプロジェクトで使用するテストパターンとベストプラクティスを定義します。すべてのテストコードはこれらのパターンに従って記述されるべきです。

## Test Organization

### Directory Structure

```
__tests__/
├── unit/                      # ユニットテスト
│   ├── lib/                  # ユーティリティ関数
│   ├── components/           # Reactコンポーネント
│   └── api/                  # APIルートハンドラ
├── e2e/                      # E2Eテスト
│   ├── guest-login.spec.ts
│   ├── auth-login.spec.ts
│   └── session-flow.spec.ts
├── fixtures/                 # テストデータ
│   ├── users.ts
│   ├── sessions.ts
│   └── schema-validator.ts
└── helpers/                  # テストヘルパー
    ├── db-setup.ts
    ├── auth-helpers.ts
    └── snapshot-helpers.ts
```

### Naming Conventions

- **テストファイル**: `*.test.ts` (ユニット), `*.spec.ts` (E2E)
- **フィクスチャ**: `{entity}.ts` (例: `users.ts`, `sessions.ts`)
- **ヘルパー**: `{purpose}-helpers.ts` (例: `auth-helpers.ts`)

## Unit Test Patterns

### Pattern 1: Utility Function Testing

**目的**: 純粋関数の入力と出力を検証

**例**: Token生成関数のテスト

```typescript
// __tests__/unit/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { generateShareToken, generateOwnerToken } from '@/lib/utils';

describe('Token Generation', () => {
  describe('generateShareToken', () => {
    it('should generate 16-character base64url token', () => {
      const token = generateShareToken();

      expect(token).toMatch(/^[A-Za-z0-9_-]{16}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateShareToken();
      const token2 = generateShareToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('generateOwnerToken', () => {
    it('should generate 32-character base64url token', () => {
      const token = generateOwnerToken();

      expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    });
  });
});
```

**ベストプラクティス**:
- `describe`で関数ごとにグループ化
- `it`で具体的な振る舞いを1つだけテスト
- エッジケース（空文字列、null、undefined等）も必ずテスト

---

### Pattern 2: React Component Testing

**目的**: ユーザー視点でコンポーネントの振る舞いを検証

**例**: PokerCardコンポーネントのテスト

```typescript
// __tests__/unit/components/PokerCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PokerCard } from '@/app/components/PokerCard';

describe('PokerCard', () => {
  it('should display card value', () => {
    render(<PokerCard value={3} selected={false} onClick={vi.fn()} />);

    expect(screen.getByRole('button')).toHaveTextContent('3');
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<PokerCard value={3} selected={false} onClick={handleClick} />);

    await userEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledWith(3);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply selected style when selected prop is true', () => {
    render(<PokerCard value={3} selected={true} onClick={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary'); // 実際のクラス名に置き換え
  });
});
```

**ベストプラクティス**:
- `getByRole`を優先（アクセシビリティ重視）
- `userEvent`で実際のユーザー操作を再現
- `vi.fn()`でイベントハンドラをモック
- スナップショットテストは避ける（brittle）

---

### Pattern 3: API Route Handler Testing

**目的**: Next.js App Router APIルートの正常系・異常系を検証

**例**: セッション作成APIのテスト

```typescript
// __tests__/unit/api/sessions.test.ts
import { POST } from '@/app/api/sessions/route';
import { prismaMock } from '__tests__/helpers/prisma-mock';

describe('POST /api/sessions', () => {
  it('should create a new session', async () => {
    const mockSession = {
      id: 'test_session_001',
      name: 'Test Session',
      shareToken: 'abcdef123456',
      ownerToken: 'owner123456789',
      ownerId: 'user_001',
      isRevealed: false,
      status: 'ACTIVE',
      createdAt: new Date(),
    };

    prismaMock.estimationSession.create.mockResolvedValue(mockSession);

    const request = new Request('http://localhost:3000/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Session', ownerId: 'user_001' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      id: 'test_session_001',
      shareToken: expect.stringMatching(/^[A-Za-z0-9_-]{16}$/),
    });
  });

  it('should return 400 if ownerId is missing', async () => {
    const request = new Request('http://localhost:3000/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Session' }), // ownerId欠落
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: expect.stringContaining('ownerId'),
    });
  });
});
```

**ベストプラクティス**:
- Prismaクライアントをモック（`vi.mock('@prisma/client')`）
- 正常系・異常系（バリデーションエラー）を両方テスト
- HTTPステータスコードとレスポンスボディを検証

---

## E2E Test Patterns

### Pattern 4: Guest User Flow

**目的**: ゲストユーザーの主要フローをエンドツーエンドで検証

**例**: ゲストログイン → セッション作成 → 見積もり投票

```typescript
// __tests__/e2e/guest-login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Guest Login Flow', () => {
  test('should allow guest to create session and estimate', async ({ page }) => {
    // ステップ1: ゲストログイン
    await page.goto('/simple-login');
    await page.fill('input[name="nickname"]', 'テストゲスト');
    await page.click('button:has-text("セッション作成")');

    // セッション作成ページに遷移
    await expect(page).toHaveURL(/\/estimate\/[a-zA-Z0-9_-]+/);

    // ステップ2: 見積もり選択
    await page.click('button:has-text("3日")');

    // 見積もりが選択されたことを確認
    const selectedCard = page.locator('button.bg-primary:has-text("3日")');
    await expect(selectedCard).toBeVisible();

    // ステップ3: 見積もり確定（オーナー操作）
    await page.click('button:has-text("公開")');

    // 統計情報が表示されることを確認
    await expect(page.locator('text=平均')).toBeVisible();
    await expect(page.locator('text=中央値')).toBeVisible();
  });

  test('should prevent session creation with empty nickname', async ({ page }) => {
    await page.goto('/simple-login');
    await page.click('button:has-text("セッション作成")');

    // エラーメッセージが表示される
    await expect(page.locator('text=ニックネームを入力してください')).toBeVisible();

    // セッション作成ページに遷移しない
    await expect(page).toHaveURL('/simple-login');
  });
});
```

**ベストプラクティス**:
- ユーザージャーニー全体を1つのテストケースとして記述
- 各ステップでURLと表示内容を検証
- エッジケース（入力エラー等）も別テストケースとして追加

---

### Pattern 5: Authenticated User Flow

**目的**: 認証ユーザーの高度な機能（プロジェクト管理等）を検証

**例**: ログイン → プロジェクト作成 → セッション作成

```typescript
// __tests__/e2e/auth-login.spec.ts
import { test, expect } from '@playwright/test';
import { createTestUser, authenticateUser } from '__tests__/helpers/auth-helpers';
import { setupTestDatabase } from '__tests__/helpers/db-setup';

test.describe('Authenticated User Flow', () => {
  let testPrisma;
  let testUser;

  test.beforeAll(async () => {
    const schemaName = 'test_e2e_auth';
    testPrisma = await setupTestDatabase(schemaName);
    testUser = await createTestUser(testPrisma, {
      email: 'test@example.com',
      nickname: 'テストユーザー',
    });
  });

  test('should allow authenticated user to create project', async ({ page }) => {
    // 認証
    await authenticateUser(page, testUser.id);

    // プロジェクト作成
    await page.goto('/projects/new');
    await page.fill('input[name="name"]', 'テストプロジェクト');
    await page.fill('textarea[name="description"]', 'これはテスト用のプロジェクトです');
    await page.click('button:has-text("作成")');

    // プロジェクト詳細ページに遷移
    await expect(page).toHaveURL(/\/projects\/[a-zA-Z0-9]+/);
    await expect(page.locator('h1:has-text("テストプロジェクト")')).toBeVisible();
  });

  test.afterAll(async () => {
    const schemaName = 'test_e2e_auth';
    await teardownTestDatabase(schemaName, testPrisma);
  });
});
```

**ベストプラクティス**:
- `beforeAll`でテストユーザーとDBをセットアップ
- `authenticateUser`ヘルパーでセッションCookieを設定
- `afterAll`で必ずクリーンアップ

---

## Database Test Patterns

### Pattern 6: Schema Isolation

**目的**: 並列実行時のデータベース競合を防止

**例**: スキーマ分離のセットアップ

```typescript
// __tests__/helpers/db-setup.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const BASE_DATABASE_URL = process.env.DATABASE_URL!;

export function getTestDatabaseUrl(schemaName: string): string {
  return `${BASE_DATABASE_URL}?schema=${schemaName}`;
}

export async function setupTestDatabase(schemaName: string) {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: getTestDatabaseUrl(schemaName) },
    },
  });

  // スキーマ作成
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

  // マイグレーション適用
  execSync(`npx prisma migrate deploy`, {
    env: {
      ...process.env,
      DATABASE_URL: getTestDatabaseUrl(schemaName),
    },
  });

  return prisma;
}

export async function teardownTestDatabase(schemaName: string, prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  await prisma.$disconnect();
}
```

**使用例**:

```typescript
let testPrisma: PrismaClient;
const schemaName = `test_unit_${process.env.VITEST_WORKER_ID || '1'}`;

beforeAll(async () => {
  testPrisma = await setupTestDatabase(schemaName);
});

afterAll(async () => {
  await teardownTestDatabase(schemaName, testPrisma);
});
```

---

### Pattern 7: Migration Validation

**目的**: Prismaマイグレーションの健全性を検証

**例**: マイグレーションテスト

```typescript
// __tests__/unit/migrations.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from '__tests__/helpers/db-setup';
import { validateSchema } from '__tests__/fixtures/schema-validator';

describe('Prisma Migrations', () => {
  let testPrisma;
  const schemaName = 'test_migration';

  beforeAll(async () => {
    testPrisma = await setupTestDatabase(schemaName);
  });

  it('should apply all migrations successfully', async () => {
    const migrations = await testPrisma.$queryRaw<Array<{ migration_name: string; applied_steps_count: number; steps_to_apply: number }>>`
      SELECT migration_name, applied_steps_count, steps_to_apply
      FROM _prisma_migrations
    `;

    // すべてのマイグレーションが完全に適用されていることを確認
    const failedMigrations = migrations.filter(
      m => m.applied_steps_count !== m.steps_to_apply
    );

    expect(failedMigrations).toHaveLength(0);
  });

  it('should have all required tables', async () => {
    await expect(validateSchema(testPrisma)).resolves.toBe(true);
  });

  afterAll(async () => {
    await teardownTestDatabase(schemaName, testPrisma);
  });
});
```

---

## Mocking Patterns

### Pattern 8: Prisma Client Mocking

**目的**: ユニットテストでデータベースアクセスをモック

**例**: Prisma Mockヘルパー

```typescript
// __tests__/helpers/prisma-mock.ts
import { PrismaClient } from '@prisma/client';
import { vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});

// 使用例
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => prismaMock),
}));
```

**使用例**:

```typescript
import { prismaMock } from '__tests__/helpers/prisma-mock';

it('should fetch user by ID', async () => {
  const mockUser = { id: 'user_001', nickname: 'Test' };
  prismaMock.user.findUnique.mockResolvedValue(mockUser);

  const user = await getUserById('user_001');

  expect(user).toEqual(mockUser);
  expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
    where: { id: 'user_001' },
  });
});
```

---

### Pattern 9: NextAuth Mocking

**目的**: 認証フローをテストで再現

**例**: NextAuthセッションモック

```typescript
// __tests__/helpers/auth-helpers.ts
import { encode } from 'next-auth/jwt';

export async function generateAuthToken(userId: string) {
  const token = await encode({
    token: {
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET!,
  });
  return token;
}

export async function authenticateUser(page, userId: string) {
  const token = await generateAuthToken(userId);
  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Date.now() / 1000 + 30 * 24 * 60 * 60,
    },
  ]);
}
```

---

## Coverage Patterns

### Pattern 10: Coverage Threshold Enforcement

**目的**: コードカバレッジ目標を強制

**設定**: `vitest.config.ts`

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  thresholds: {
    lines: 60,
    functions: 60,
    branches: 60,
    statements: 60,
  },
  exclude: [
    'node_modules/',
    '__tests__/',
    '.next/',
    '*.config.ts',
    'types/',
  ],
}
```

**除外対象**:
- テストファイル自体（`__tests__/`）
- 設定ファイル（`*.config.ts`）
- 型定義（`types/`, `*.d.ts`）
- ビルド成果物（`.next/`）

---

## Best Practices

### 1. Test Independence

各テストは独立して実行可能であるべき：

```typescript
// ✅ Good: 各テストで独自のデータをセットアップ
it('should create session', async () => {
  const user = await createTestUser({ nickname: 'User1' });
  const session = await createSession(user.id);
  expect(session).toBeDefined();
});

// ❌ Bad: 前のテストの結果に依存
let sharedSession;

it('should create session', async () => {
  sharedSession = await createSession('user_001');
});

it('should update session', async () => {
  await updateSession(sharedSession.id); // 前のテストが失敗すると動かない
});
```

### 2. Deterministic Tests

テストは再現可能であるべき：

```typescript
// ✅ Good: 固定の日時を使用
const mockDate = new Date('2025-12-30T00:00:00Z');
vi.setSystemTime(mockDate);

// ❌ Bad: 現在時刻に依存
const now = new Date();
expect(session.createdAt).toBeAfter(now); // 実行タイミングで結果が変わる
```

### 3. Clear Test Descriptions

テスト名は「何をテストしているか」を明確に：

```typescript
// ✅ Good
it('should return 400 when nickname is empty', async () => {});

// ❌ Bad
it('should work', async () => {});
it('test1', async () => {});
```

### 4. Minimal Assertions

1つのテストケースで検証する内容は最小限に：

```typescript
// ✅ Good
it('should create session with correct share token format', () => {
  const session = createSession();
  expect(session.shareToken).toMatch(/^[A-Za-z0-9_-]{16}$/);
});

it('should create session with active status', () => {
  const session = createSession();
  expect(session.status).toBe('ACTIVE');
});

// ❌ Bad
it('should create valid session', () => {
  const session = createSession();
  expect(session.shareToken).toMatch(/^[A-Za-z0-9_-]{16}$/);
  expect(session.status).toBe('ACTIVE');
  expect(session.isRevealed).toBe(false);
  // 複数の概念を1つのテストで検証
});
```

---

## Debugging Patterns

### Pattern 11: Using Vitest UI

```bash
npm run test:ui
```

ブラウザで`http://localhost:51204/__vitest__/`を開き、テストを視覚的にデバッグ。

### Pattern 12: Playwright Trace Viewer

```bash
npx playwright show-trace playwright-report/trace.zip
```

失敗したE2Eテストのトレースを再生して原因を特定。

### Pattern 13: Debugging with VS Code

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Vitest Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test", "--", "--run"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## Summary

これらのパターンに従うことで：

- **一貫性**: すべてのテストが同じ構造に従う
- **保守性**: 新しいテストの追加が容易
- **信頼性**: 並列実行時の競合がない
- **デバッグ性**: 失敗時の原因特定が迅速

次のステップ: [quickstart.md](../quickstart.md)でテスト実行方法を確認してください。
