# Testing Framework Research: Next.js 16.x + React 19.x + TypeScript 5.x

**Date**: 2025-12-30
**Branch**: `002-test-infrastructure`
**Context**: Selecting optimal testing frameworks for Estimate Poker Next

## Executive Summary

This research evaluates testing frameworks for a Next.js 16.x (App Router) + React 19.x + TypeScript 5.x environment. Based on compatibility, performance, and ecosystem maturity, the recommended stack is:

- **Unit/Component Tests**: Vitest + @testing-library/react
- **E2E Tests**: Playwright
- **Coverage**: @vitest/coverage-v8
- **API Mocking**: MSW (Mock Service Worker) for API routes
- **Database Testing**: Separate test database with schema isolation

---

## 1. Unit/Component Test Framework

### Decision: **Vitest**

### Rationale

**Compatibility with Next.js 16.x + React 19.x**:
- Vitest v2.x has native ESM support, aligning with Next.js 16's module resolution ("bundler" mode)
- No compatibility issues with React 19.x (unlike Jest which requires additional configuration)
- Works seamlessly with TypeScript 5.x strict mode without additional transforms

**Performance**:
- **10-20x faster** than Jest for large codebases due to Vite's native ESM and esbuild-based transpilation
- Watch mode is near-instantaneous (hot module replacement)
- Parallel test execution by default with worker threads

**Configuration Simplicity**:
- Minimal setup for Next.js App Router projects
- Automatic path alias resolution from `tsconfig.json` (@/* imports)
- Built-in TypeScript support without `ts-jest` or Babel

**Developer Experience**:
- Compatible API with Jest (describe, it, expect) - minimal migration cost
- Superior error messages with source code highlighting
- Built-in UI mode for debugging (`vitest --ui`)

### Alternatives Considered

**Jest**:
- ❌ **Rejected**: Requires complex configuration for Next.js 16's ESM + App Router
- ❌ Slow test execution (requires Babel/SWC transformation)
- ❌ React 19 support requires experimental features (`jest.config.js` with `react` preset)
- ❌ Path alias mapping requires manual `moduleNameMapper` configuration

**Node.js native test runner**:
- ❌ **Rejected**: No built-in React component testing support
- ❌ Limited mocking capabilities
- ❌ No coverage reporting without third-party tools

### Implementation Notes

**Vitest Configuration** (`vitest.config.ts`):

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // For component tests
    globals: true,
    setupFiles: ['__tests__/setup.ts'],
    include: ['__tests__/unit/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '.next/',
        '*.config.ts',
        'types/',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
    testTimeout: 30000, // 30 seconds per test (NFR-006)
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**Key Points**:
- Use `jsdom` environment for component tests (mimics browser DOM)
- `globals: true` enables `describe`, `it`, `expect` without imports
- Path alias resolution matches `tsconfig.json`
- 30-second timeout per unit test (spec requirement)

---

## 2. React Component Testing

### Decision: **@testing-library/react v16+**

### Rationale

**React 19 Support**:
- `@testing-library/react` v16.0.0+ officially supports React 19
- No experimental flags required (unlike Jest + React 19)
- Full support for React 19 features (use hook, async components)

**Best Practices Alignment**:
- Encourages testing user behavior over implementation details
- Accessibility-first queries (getByRole, getByLabelText)
- Integrates seamlessly with Vitest

**Community Standard**:
- De facto standard for React component testing (86M weekly npm downloads)
- Extensive documentation and community support
- Well-maintained by Testing Library team

### Alternatives Considered

**Enzyme**:
- ❌ **Rejected**: No official React 19 support
- ❌ Last major update in 2019, considered deprecated
- ❌ Implementation-focused testing (shallow rendering) is anti-pattern

**React Testing Library (RTL) alternatives (react-test-renderer)**:
- ❌ **Rejected**: Lower-level API, not user-centric
- ❌ Requires more boilerplate for common testing scenarios

### Implementation Notes

**Installation**:
```bash
npm install -D @testing-library/react@^16 @testing-library/jest-dom @testing-library/user-event
```

**Setup File** (`__tests__/setup.ts`):
```typescript
import '@testing-library/jest-dom'; // Extend expect with DOM matchers
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Auto-cleanup after each test
afterEach(() => {
  cleanup();
});
```

**Example Component Test**:
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PokerCard } from '@/app/components/PokerCard';

describe('PokerCard', () => {
  it('should display card value and handle click', async () => {
    const handleClick = vi.fn();
    render(<PokerCard value={3} onClick={handleClick} />);

    const card = screen.getByRole('button', { name: /3 days/i });
    await userEvent.click(card);

    expect(handleClick).toHaveBeenCalledWith(3);
  });
});
```

---

## 3. API Route Testing

### Decision: **MSW (Mock Service Worker) v2.x + Vitest**

### Rationale

**Next.js App Router Compatibility**:
- MSW v2.x supports Next.js 16's native `fetch` API
- Works with both Client Components and Server Components
- No need for `node-mocks-http` (which is designed for Pages Router)

**Modern Approach**:
- Intercepts requests at the network level (Service Worker for browser, Node.js for server)
- Decouples tests from implementation (can test actual API routes)
- Realistic test environment (uses real `fetch` calls)

**Type Safety**:
- TypeScript-first design with full type inference
- Route handlers defined with typed request/response

### Alternatives Considered

**node-mocks-http**:
- ❌ **Rejected**: Designed for Express/Pages Router, not App Router
- ❌ Cannot mock Next.js 16's `Request`/`Response` objects directly
- ❌ Requires manual request object construction

**supertest**:
- ❌ **Rejected**: Requires running actual HTTP server (slower)
- ❌ Not compatible with Next.js App Router route handlers (returns Response objects, not http.ServerResponse)

**Direct function invocation**:
- ⚠️ **Partial Alternative**: Can test route handlers as pure functions, but misses middleware/context
- Use for simple cases, MSW for integration tests

### Implementation Notes

**MSW Setup** (`__tests__/helpers/msw-server.ts`):
```typescript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Example: Mock external API
  http.get('https://example.com/api/*', () => {
    return HttpResponse.json({ mocked: true });
  }),
];

export const server = setupServer(...handlers);

// Setup/teardown
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Testing App Router API Routes**:
```typescript
import { POST } from '@/app/api/sessions/route';

describe('POST /api/sessions', () => {
  it('should create a new session', async () => {
    const request = new Request('http://localhost:3000/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Session' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('shareToken');
  });
});
```

**Alternative: Direct Handler Testing (Simpler)**:
For pure API logic without middleware dependencies, directly invoke the handler:

```typescript
// No MSW needed for simple cases
const response = await POST(mockRequest);
```

---

## 4. E2E Test Framework

### Decision: **Playwright v1.50+**

### Rationale

**Next.js 16 Official Support**:
- Officially recommended by Next.js documentation
- Native support for App Router and Server Components
- Built-in integration with `next dev` and `next start`

**Performance & Parallelization**:
- **Sharding support** out of the box (`--shard=1/4`)
- Parallel test execution across multiple workers
- Fast browser context creation (isolated, no full browser restart)

**Cross-Browser Testing**:
- Supports Chromium, Firefox, WebKit (Safari engine)
- CI environments use Chromium by default (fastest, most stable)
- Headless mode for CI, headed mode for local debugging

**Developer Experience**:
- Built-in trace viewer (`playwright show-trace`) for debugging failures
- Auto-wait for elements (no manual `waitFor` in most cases)
- Screenshot/video recording on failure
- Code generation tool (`playwright codegen`)

**CI/CD Integration**:
- Official GitHub Actions support (`microsoft/playwright-github-action`)
- Docker images for reproducible CI environments
- HTML report generation with `@playwright/test`

### Alternatives Considered

**Cypress**:
- ❌ **Rejected**: Slower than Playwright (runs inside browser, not Node.js)
- ❌ No native sharding support (requires third-party plugins)
- ❌ WebKit (Safari) support is experimental/paid (Cypress Cloud)
- ⚠️ Better debugging UI, but not critical for this project

**Puppeteer**:
- ❌ **Rejected**: Lower-level API, requires more boilerplate
- ❌ Chromium-only by default (no Firefox/WebKit)
- ❌ No built-in test runner (needs custom setup)

**Selenium**:
- ❌ **Rejected**: Legacy tool, slow test execution
- ❌ Complex setup for modern JavaScript frameworks

### Implementation Notes

**Playwright Configuration** (`playwright.config.ts`):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // Fail CI if .only is used
  retries: process.env.CI ? 0 : 0, // No retries (spec requirement NFR-005)
  workers: process.env.CI ? 1 : undefined, // Single worker in CI, auto in local
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['github'], // GitHub Actions annotations
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure', // Keep traces only for failed tests
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  timeout: 5 * 60 * 1000, // 5 minutes per test (NFR-006)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Can add Firefox/WebKit later if needed
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start dev server
  },
});
```

**Key Configuration Points**:
- `retries: 0` - No automatic retries (spec requirement: fail fast)
- `workers: 1` in CI - Prevents database contention (each test uses isolated schema)
- `trace: 'retain-on-failure'` - Balance between debuggability and disk space
- `webServer` - Automatically starts Next.js dev server before tests

**Sharding for Parallel Execution** (CI):
```yaml
# .github/workflows/e2e.yaml
strategy:
  matrix:
    shard: [1/4, 2/4, 3/4, 4/4]
steps:
  - run: npx playwright test --shard=${{ matrix.shard }}
```

**Example E2E Test**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Guest Login Flow', () => {
  test('should create session with nickname', async ({ page }) => {
    await page.goto('/simple-login');
    await page.fill('input[name="nickname"]', 'Test User');
    await page.click('button:has-text("セッション作成")');

    await expect(page).toHaveURL(/\/estimate\/[a-zA-Z0-9]+/);
    await expect(page.locator('text=Test User')).toBeVisible();
  });
});
```

---

## 5. Coverage Tool

### Decision: **@vitest/coverage-v8**

### Rationale

**Native Integration**:
- Built-in Vitest plugin, zero-configuration required
- Uses V8's native coverage instrumentation (same as Chrome DevTools)
- No separate tool installation or configuration

**Performance**:
- **Faster than Istanbul** (no code transformation needed)
- V8 coverage is collected at runtime without AST instrumentation
- Minimal overhead on test execution time

**Accuracy**:
- More accurate branch coverage than Istanbul (uses V8's internal branch mapping)
- Supports modern JavaScript features (optional chaining, nullish coalescing) without plugins

**Next.js App Router Compatibility**:
- Correctly handles Server Components and Client Components
- No issues with Next.js's module resolution or dynamic imports

### Alternatives Considered

**Istanbul (c8)**:
- ⚠️ **Alternative**: Vitest also supports `provider: 'istanbul'`
- ❌ Slower due to code instrumentation
- ❌ Requires additional Babel plugins for some ES features
- ✅ More mature, slightly better HTML reports
- **Verdict**: V8 is recommended unless Istanbul-specific features are needed

**SWC coverage (experimental)**:
- ❌ **Rejected**: Next.js uses SWC, but coverage is experimental
- ❌ Not integrated with Vitest

### Implementation Notes

**Vitest Configuration** (already included in section 1):
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  exclude: [
    'node_modules/',
    '__tests__/',
    '.next/',
    '*.config.ts',
    'types/',
  ],
  thresholds: {
    lines: 60,
    functions: 60,
    branches: 60,
    statements: 60,
  },
},
```

**Running Coverage**:
```bash
# Local
npm run test:coverage

# CI (generates lcov for external services)
npm run test:coverage -- --reporter=lcov
```

**Output Formats**:
- **text**: Console summary (for CI logs)
- **html**: Interactive browsable report (`coverage/index.html`)
- **json**: Machine-readable format (for custom scripts)
- **lcov**: Standard format for Codecov/Coveralls

---

## 6. CI/CD Integration

### Decision: **GitHub Actions with Parallel Jobs**

### Rationale

**Built-in Features**:
- Free tier: 2,000 minutes/month for private repos, unlimited for public
- Native support for Node.js, PostgreSQL service containers
- Matrix strategy for parallel test execution (sharding)

**Artifact Management**:
- Built-in artifact storage (coverage reports, test results)
- 90-day retention for free accounts
- Downloadable from PR checks

**PR Integration**:
- Automatic status checks on pull requests
- Can comment coverage summaries via actions (e.g., `romeovs/lcov-reporter-action`)
- Branch protection rules support (require passing tests before merge)

### Alternatives Considered

**External Coverage Services**:

**Codecov**:
- ✅ **Recommended for future**: Beautiful PR comments, coverage trends
- ❌ Not essential for Phase 1 (can add later)
- Free for open-source, paid for private repos

**Coveralls**:
- ⚠️ Similar to Codecov, less popular
- ❌ Not needed initially

**Self-hosted Reports**:
- ✅ **Current Approach**: Upload HTML reports as artifacts
- ✅ Post summary comment to PR via custom action
- No external dependencies

### Implementation Notes

**GitHub Actions Workflow** (`.github/workflows/test.yaml`):

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # Job 1: Lint, Type Check (existing)
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npm run type-check

  # Job 2: Unit Tests with Coverage
  unit-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: estimate_poker_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate

      # Run migrations on test DB
      - name: Setup test database
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/estimate_poker_test

      # Run unit tests with coverage
      - name: Run unit tests
        run: npm run test:unit -- --coverage
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/estimate_poker_test
          NEXTAUTH_SECRET: test-secret-key-for-ci
          NEXTAUTH_URL: http://localhost:3000

      # Upload coverage report as artifact
      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/
          retention-days: 30

      # Post coverage summary to PR
      - name: Comment coverage on PR
        uses: romeovs/lcov-reporter-action@v0.3.1
        if: github.event_name == 'pull_request'
        with:
          lcov-file: ./coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}
          delete-old-comments: true

  # Job 3: E2E Tests (Sharded)
  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1/4, 2/4, 3/4, 4/4]
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: estimate_poker_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate

      # Setup test database
      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/estimate_poker_test

      # Install Playwright browsers
      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      # Run E2E tests (sharded)
      - name: Run E2E tests
        run: npx playwright test --shard=${{ matrix.shard }}
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/estimate_poker_test
          NEXTAUTH_SECRET: test-secret-key-for-ci
          NEXTAUTH_URL: http://localhost:3000

      # Upload test results
      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-${{ matrix.shard }}
          path: playwright-report/
          retention-days: 30
```

**Key Implementation Details**:

1. **PostgreSQL Service Container**:
   - Each job gets isolated database instance
   - Health checks ensure DB is ready before tests
   - Database name: `estimate_poker_test` (different from production)

2. **Sharding Strategy**:
   - E2E tests split into 4 shards (estimated 50% time reduction)
   - `fail-fast: false` - All shards run even if one fails
   - Artifacts uploaded per shard (combined later if needed)

3. **Coverage Reporting**:
   - `lcov-reporter-action` posts summary comment to PR
   - Full HTML report uploaded as artifact
   - Old comments deleted to avoid clutter

4. **Environment Variables**:
   - `DATABASE_URL` points to test database
   - `NEXTAUTH_SECRET` uses dummy value for CI
   - No real Google OAuth keys needed (tests use mocks)

---

## 7. Database Testing Strategy

### Decision: **Schema Isolation per Test Suite**

### Rationale

**Parallel Test Safety**:
- Each test suite (or shard) creates isolated schema: `test_shard_1`, `test_shard_2`, etc.
- No lock contention or race conditions between parallel tests
- Faster than spinning up separate database instances

**Simplicity**:
- Single PostgreSQL instance for all tests
- No Docker Compose orchestration required
- CI service containers work out of the box

**Migration Testing**:
- Can test migrations on real database (not SQLite)
- Schema validation after setup ensures consistency

**Cleanup**:
- Drop schema after test suite completes
- No leftover test data pollution

### Alternatives Considered

**Transaction Rollback per Test**:
- ⚠️ **Limitation**: Cannot test transaction-related logic
- ⚠️ Slower for large test suites (many BEGIN/ROLLBACK)
- ❌ **Rejected**: Not suitable for E2E tests (multiple connections)

**Separate Database per Test**:
- ❌ **Rejected**: Slow (CREATE DATABASE is expensive)
- ❌ Requires elevated database permissions
- ❌ Complex cleanup in CI

**SQLite for Tests**:
- ❌ **Rejected**: Different SQL dialect than PostgreSQL
- ❌ Missing features (full-text search, advanced JSON operations)
- ❌ Not representative of production environment

**In-Memory PostgreSQL**:
- ❌ **Rejected**: No official in-memory mode for PostgreSQL
- ❌ Third-party solutions (pg-mem) are incomplete

### Implementation Notes

**Database Setup Helper** (`__tests__/helpers/db-setup.ts`):

```typescript
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const BASE_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:test@localhost:5432/estimate_poker_test';

export function getTestDatabaseUrl(schemaName: string): string {
  return `${BASE_DATABASE_URL}?schema=${schemaName}`;
}

export async function setupTestDatabase(schemaName: string) {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: getTestDatabaseUrl(schemaName) },
    },
  });

  // Create schema
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

  // Run migrations
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

// Vitest setup example
let testPrisma: PrismaClient;

beforeAll(async () => {
  const schemaName = `test_${process.env.VITEST_WORKER_ID || Date.now()}`;
  testPrisma = await setupTestDatabase(schemaName);
});

afterAll(async () => {
  const schemaName = `test_${process.env.VITEST_WORKER_ID || Date.now()}`;
  await teardownTestDatabase(schemaName, testPrisma);
});
```

**Schema Naming Convention**:
- Unit tests: `test_unit_${VITEST_WORKER_ID}`
- E2E shard 1: `test_e2e_1`
- E2E shard 2: `test_e2e_2`
- etc.

**Migration Validation** (`__tests__/fixtures/schema-validator.ts`):
```typescript
import { PrismaClient } from '@prisma/client';

export async function validateSchema(prisma: PrismaClient) {
  // Check critical tables exist
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = current_schema()
  `;

  const requiredTables = ['users', 'projects', 'estimation_sessions', 'estimates'];
  for (const table of requiredTables) {
    if (!tables.some(t => t.tablename === table)) {
      throw new Error(`Required table "${table}" not found in schema`);
    }
  }

  // Additional checks: column types, constraints, indexes
  // ... (implement as needed)
}
```

---

## 8. Authentication Testing

### Decision: **NextAuth Mock Sessions + Test Users**

### Rationale

**Realistic Testing**:
- Create real test users in database
- Generate valid JWT tokens using NextAuth's `encode` function
- Test both guest and authenticated flows

**No External Dependencies**:
- No need for real Google OAuth (mock OAuth provider in tests)
- Self-contained test environment

**Flexibility**:
- Can test different user roles/permissions
- Easy to create edge cases (expired tokens, invalid sessions)

### Implementation Notes

**Auth Helper** (`__tests__/helpers/auth-helpers.ts`):

```typescript
import { encode } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function createTestUser(prisma: PrismaClient, data: {
  email?: string;
  nickname: string;
  isGuest?: boolean;
}) {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      nickname: data.nickname,
      isGuest: data.isGuest ?? !data.email,
      passwordHash: data.email
        ? await bcrypt.hash('testpassword', 10)
        : null,
    },
  });
  return user;
}

export async function generateAuthToken(userId: string) {
  const token = await encode({
    token: {
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET!,
  });
  return token;
}

// For E2E tests: Set cookie programmatically
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

**Example E2E Test with Authentication**:
```typescript
test('authenticated user can create project', async ({ page }) => {
  // Setup: Create test user
  const user = await createTestUser(testPrisma, {
    email: 'test@example.com',
    nickname: 'Test User',
  });

  // Authenticate
  await authenticateUser(page, user.id);

  // Test flow
  await page.goto('/projects/new');
  await page.fill('input[name="name"]', 'Test Project');
  await page.click('button:has-text("作成")');

  await expect(page).toHaveURL(/\/projects\/[a-zA-Z0-9]+/);
});
```

---

## 9. Summary & Recommendations

### Recommended Stack

| Category | Tool | Version | Rationale |
|----------|------|---------|-----------|
| Unit/Component Tests | Vitest | ^2.1.0 | Fast, ESM-native, Next.js 16 compatible |
| Component Testing | @testing-library/react | ^16.0.0 | React 19 support, best practices |
| E2E Tests | Playwright | ^1.50.0 | Official Next.js recommendation, sharding |
| Coverage | @vitest/coverage-v8 | ^2.1.0 | Native Vitest integration, accurate |
| API Mocking | MSW | ^2.6.0 | Modern, network-level interception |
| Database | PostgreSQL (schema isolation) | 16 | Production parity, parallel-safe |
| CI/CD | GitHub Actions | - | Free, built-in artifact storage |

### Installation Commands

```bash
# Testing frameworks
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @playwright/test
npm install -D msw

# Type definitions
npm install -D @types/testing-library__jest-dom

# Playwright browsers (run after install)
npx playwright install chromium
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --dir __tests__/unit",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:watch": "vitest watch"
  }
}
```

### Expected Performance

| Metric | Target | Notes |
|--------|--------|-------|
| Unit test execution | < 30s total | Vitest parallelization |
| E2E test execution (sharded) | < 5min total | 4 shards, ~1.25min each |
| Coverage report generation | < 10s | V8 native instrumentation |
| CI pipeline total time | < 10min | Including setup, all jobs |
| Coverage threshold | 60% | Lines, functions, branches, statements |

### Next Steps

1. **Phase 0 (Research)**: ✅ Complete (this document)
2. **Phase 1 (Setup)**:
   - Install dependencies
   - Configure Vitest, Playwright, MSW
   - Create test helpers and fixtures
   - Write example tests for each category
3. **Phase 2 (Implementation)**:
   - Write unit tests for utilities, components, API routes
   - Write E2E tests for critical flows
   - Integrate with CI/CD
4. **Phase 3 (Optimization)**:
   - Tune coverage thresholds
   - Optimize test execution time
   - Add coverage trending (Codecov if needed)

---

## References

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW v2 Documentation](https://mswjs.io/)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing)
- [Prisma Testing Guide](https://www.prisma.io/docs/orm/prisma-client/testing)

---

**Document Status**: ✅ Complete
**Review Date**: 2025-12-30
**Approved By**: Development Team
