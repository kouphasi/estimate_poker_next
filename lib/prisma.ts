import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// DATABASE_URL を取得（直接接続を優先して prepared statements エラーを回避）
function getDatabaseUrl() {
  // POSTGRES_URL_NON_POOLING がある場合は優先（直接接続、prepared statements 対応）
  // Vercel では自動的に設定されている
  if (process.env.POSTGRES_URL_NON_POOLING) {
    console.log('[Prisma] Using POSTGRES_URL_NON_POOLING (direct connection, supports prepared statements)')
    return process.env.POSTGRES_URL_NON_POOLING
  }

  // フォールバック：DATABASE_URL を使用
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL or POSTGRES_URL_NON_POOLING is required')
  }

  console.log('[Prisma] Using DATABASE_URL (pooled connection)')

  // pgbouncer パラメータが含まれていない場合は追加
  if (!url.includes('pgbouncer=')) {
    const separator = url.includes('?') ? '&' : '?'
    const modifiedUrl = `${url}${separator}pgbouncer=true`
    console.log('[Prisma] Added pgbouncer=true to DATABASE_URL')
    return modifiedUrl
  }

  return url
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Note: Graceful shutdown handlers (process.on) are intentionally omitted
// Reason: Next.js static analysis detects process.on() as incompatible with Edge Runtime,
//         even though this file is never executed in Edge Runtime (used only in API routes)
// Impact: In serverless environments (Vercel, etc.), this is not an issue:
//         - Connection pooling is managed by Prisma Client automatically
//         - Process lifecycle is managed by the serverless platform
//         - Explicit shutdown handlers can cause issues with function cold starts
// For traditional long-running servers: Consider adding shutdown handlers in a separate initialization file
