import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDatabase, teardownTestDatabase, generateSchemaName } from '../helpers/db-setup';
import { validateSchema, testDatabaseConnection } from '../fixtures/schema-validator';
import { PrismaClient } from '@prisma/client';

const hasDatabase = !!process.env.DATABASE_URL;

describe('Prisma Migrations', () => {
  let testPrisma: PrismaClient;
  const schemaName = generateSchemaName('test_migration');

  beforeAll(async () => {
    if (!hasDatabase) {
      return;
    }
    testPrisma = await setupTestDatabase(schemaName);
  }, 120000); // 2分のタイムアウト（マイグレーション適用に時間がかかる可能性があるため）

  it.skipIf(!hasDatabase)('should connect to test database successfully', async () => {
    const result = await testDatabaseConnection(testPrisma);
    expect(result).toBe(true);
  });

  it.skipIf(!hasDatabase)('should apply all migrations successfully', async () => {
    const migrations = await testPrisma.$queryRaw<
      Array<{
        migration_name: string;
        finished_at: Date | null;
        rolled_back_at: Date | null;
      }>
    >`
      SELECT migration_name, finished_at, rolled_back_at
      FROM _prisma_migrations
    `;

    // すべてのマイグレーションが完全に適用されていることを確認
    // finished_atがnullまたはrolled_back_atが設定されている場合は失敗
    const failedMigrations = migrations.filter(
      m => m.finished_at === null || m.rolled_back_at !== null
    );

    expect(failedMigrations).toHaveLength(0);
  });

  it.skipIf(!hasDatabase)('should have all required tables', async () => {
    const result = await validateSchema(testPrisma);
    expect(result).toBe(true);
  });

  it.skipIf(!hasDatabase)('should have correct table structure for users', async () => {
    const columns = await testPrisma.$queryRaw<
      Array<{ column_name: string; data_type: string }>
    >`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = current_schema()
    `;

    const columnNames = columns.map(c => c.column_name);

    // 必須カラムの確認（データベースではスネークケース）
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('email');
    expect(columnNames).toContain('nickname');
    expect(columnNames).toContain('isGuest');
    expect(columnNames).toContain('password_hash');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');
  });

  it.skipIf(!hasDatabase)('should have correct table structure for estimation_sessions', async () => {
    const columns = await testPrisma.$queryRaw<
      Array<{ column_name: string; data_type: string }>
    >`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'estimation_sessions'
      AND table_schema = current_schema()
    `;

    const columnNames = columns.map(c => c.column_name);

    // 必須カラムの確認（データベースではスネークケース）
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('shareToken');
    expect(columnNames).toContain('ownerToken');
    expect(columnNames).toContain('ownerId');
    expect(columnNames).toContain('project_id');
    expect(columnNames).toContain('isRevealed');
    expect(columnNames).toContain('status');
    expect(columnNames).toContain('finalEstimate');
    expect(columnNames).toContain('created_at');
  });

  afterAll(async () => {
    if (!hasDatabase || !testPrisma) {
      return;
    }
    await teardownTestDatabase(schemaName, testPrisma);
  });
});
