// Prismaエラー型定義
export interface PrismaError extends Error {
  code?: string;
  meta?: Record<string, unknown>;
}

export function isPrismaError(error: unknown): error is PrismaError {
  return error instanceof Error && 'code' in error;
}
