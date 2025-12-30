/**
 * Prismaエラー型定義
 */
export interface PrismaError extends Error {
  code?: string;
  meta?: Record<string, unknown>;
}

/**
 * Prismaエラーかどうかを判定する型ガード
 */
export function isPrismaError(error: unknown): error is PrismaError {
  return error instanceof Error && 'code' in error;
}

/**
 * 一意制約違反エラーかどうかを判定
 * Prismaエラーコード: P2002
 */
export function isUniqueConstraintViolation(error: unknown): boolean {
  return isPrismaError(error) && error.code === 'P2002';
}

/**
 * 外部キー制約違反エラーかどうかを判定
 * Prismaエラーコード: P2003
 */
export function isForeignKeyConstraintViolation(error: unknown): boolean {
  return isPrismaError(error) && error.code === 'P2003';
}

/**
 * レコードが見つからないエラーかどうかを判定
 * Prismaエラーコード: P2025
 */
export function isRecordNotFoundError(error: unknown): boolean {
  return isPrismaError(error) && error.code === 'P2025';
}
