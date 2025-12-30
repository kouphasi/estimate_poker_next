import { PrismaClient } from '@prisma/client';

/**
 * Prismaスキーマの整合性を検証
 * - 必須テーブルの存在確認
 * - マイグレーション適用状態の確認
 * @param prisma Prismaクライアントインスタンス
 * @returns 検証成功時はtrue
 * @throws 検証失敗時はエラーをスロー
 */
export async function validateSchema(prisma: PrismaClient): Promise<boolean> {
  // 必須テーブルのリスト（PostgreSQLではスネークケース）
  const requiredTables = [
    'users',
    'projects',
    'estimation_sessions',
    'estimates',
    'accounts',
    'sessions',
    'verification_tokens',
  ];

  // 現在のスキーマのテーブル一覧を取得
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = current_schema()
  `;

  const tableNames = tables.map(t => t.tablename);

  // 必須テーブルの存在確認
  const missingTables = requiredTables.filter(
    table => !tableNames.includes(table)
  );

  if (missingTables.length > 0) {
    throw new Error(
      `Required tables missing from schema: ${missingTables.join(', ')}\n` +
      `Available tables: ${tableNames.join(', ')}`
    );
  }

  // マイグレーション適用状態の確認
  const migrations = await prisma.$queryRaw<
    Array<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }>
  >`
    SELECT migration_name, finished_at, rolled_back_at
    FROM _prisma_migrations
  `;

  // finished_atがnullまたはrolled_back_atが設定されている場合は失敗
  const failedMigrations = migrations.filter(
    m => m.finished_at === null || m.rolled_back_at !== null
  );

  if (failedMigrations.length > 0) {
    throw new Error(
      `Failed migrations detected: ${failedMigrations.map(m => m.migration_name).join(', ')}`
    );
  }

  return true;
}

/**
 * データベース接続をテスト
 * @param prisma Prismaクライアントインスタンス
 * @returns 接続成功時はtrue
 */
export async function testDatabaseConnection(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    throw new Error(`Database connection failed: ${error}`);
  }
}
