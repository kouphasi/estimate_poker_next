import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const BASE_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/estimate_poker_test';

/**
 * テスト用のデータベースURLを生成
 * @param schemaName スキーマ名（並列実行時のスキーマ分離用）
 * @returns データベース接続URL
 */
export function getTestDatabaseUrl(schemaName: string): string {
  return `${BASE_DATABASE_URL}?schema=${schemaName}`;
}

/**
 * テスト用データベースのセットアップ
 * - スキーマを作成
 * - マイグレーションを適用
 * @param schemaName スキーマ名
 * @returns Prismaクライアントインスタンス
 */
export async function setupTestDatabase(schemaName: string): Promise<PrismaClient> {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: getTestDatabaseUrl(schemaName) },
    },
  });

  try {
    // スキーマ作成
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    // マイグレーション適用
    execSync(`npx prisma migrate deploy`, {
      env: {
        ...process.env,
        DATABASE_URL: getTestDatabaseUrl(schemaName),
      },
      stdio: 'inherit',
    });

    return prisma;
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}

/**
 * テスト用データベースのクリーンアップ
 * - スキーマをカスケード削除
 * - Prismaクライアントを切断
 * @param schemaName スキーマ名
 * @param prisma Prismaクライアントインスタンス
 */
export async function teardownTestDatabase(schemaName: string, prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * テストスイート用のスキーマ名を生成
 * @param prefix スキーマ名のプレフィックス（例: "test_unit", "test_e2e"）
 * @returns スキーマ名（例: "test_unit_1", "test_e2e_2"）
 */
export function generateSchemaName(prefix: string): string {
  const workerId = process.env.VITEST_WORKER_ID || process.env.TEST_WORKER_ID || Date.now().toString();
  return `${prefix}_${workerId}`;
}
