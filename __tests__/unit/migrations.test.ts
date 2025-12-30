import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDatabase, teardownTestDatabase, generateSchemaName } from '../helpers/db-setup';
import { validateSchema, testDatabaseConnection } from '../fixtures/schema-validator';
import { PrismaClient } from '@prisma/client';

describe('Prisma Migrations', () => {
  let testPrisma: PrismaClient;
  const schemaName = generateSchemaName('test_migration');

  beforeAll(async () => {
    testPrisma = await setupTestDatabase(schemaName);
  }, 120000); // 2分のタイムアウト（マイグレーション適用に時間がかかる可能性があるため）

  it('should connect to test database successfully', async () => {
    const result = await testDatabaseConnection(testPrisma);
    expect(result).toBe(true);
  });

  it('should apply all migrations successfully', async () => {
    const migrations = await testPrisma.$queryRaw<
      Array<{
        migration_name: string;
        applied_steps_count: number;
        steps_to_apply: number;
      }>
    >`
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
    const result = await validateSchema(testPrisma);
    expect(result).toBe(true);
  });

  it('should have correct table structure for users', async () => {
    const columns = await testPrisma.$queryRaw<
      Array<{ column_name: string; data_type: string }>
    >`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = current_schema()
    `;

    const columnNames = columns.map(c => c.column_name);

    // 必須カラムの確認
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('email');
    expect(columnNames).toContain('nickname');
    expect(columnNames).toContain('isGuest');
    expect(columnNames).toContain('passwordHash');
    expect(columnNames).toContain('createdAt');
    expect(columnNames).toContain('updatedAt');
  });

  it('should have correct table structure for estimation_sessions', async () => {
    const columns = await testPrisma.$queryRaw<
      Array<{ column_name: string; data_type: string }>
    >`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'estimation_sessions'
      AND table_schema = current_schema()
    `;

    const columnNames = columns.map(c => c.column_name);

    // 必須カラムの確認
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('shareToken');
    expect(columnNames).toContain('ownerToken');
    expect(columnNames).toContain('ownerId');
    expect(columnNames).toContain('projectId');
    expect(columnNames).toContain('isRevealed');
    expect(columnNames).toContain('status');
    expect(columnNames).toContain('finalEstimate');
    expect(columnNames).toContain('createdAt');
  });

  afterAll(async () => {
    await teardownTestDatabase(schemaName, testPrisma);
  });
});
