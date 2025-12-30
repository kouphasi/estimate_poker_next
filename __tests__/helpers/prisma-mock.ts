import { PrismaClient } from '@prisma/client';
import { vi } from 'vitest';

/**
 * モック化されたPrismaクライアント
 * - ユニットテストでデータベースアクセスをモック化するためのヘルパー
 * - viのモック機能を使用
 */

// Prismaクライアントのモック型定義
type MockPrismaClient = {
  [K in keyof PrismaClient]: PrismaClient[K] extends (...args: any[]) => any
    ? ReturnType<typeof vi.fn>
    : PrismaClient[K];
};

// Prismaモジュール全体をモック化
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    project: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    estimationSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    estimate: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $executeRawUnsafe: vi.fn(),
    $queryRaw: vi.fn(),
  })),
}));

/**
 * テスト用のモック化されたPrismaクライアントインスタンスを作成
 */
export function createMockPrisma(): MockPrismaClient {
  return new PrismaClient() as unknown as MockPrismaClient;
}
