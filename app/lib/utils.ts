import { randomBytes } from 'crypto'

// 共有トークン生成（暗号学的に安全な16文字）
export function generateShareToken(): string {
  return randomBytes(12).toString('base64url').substring(0, 16)
}

// オーナートークン生成（セッション所有者認証用）
export function generateOwnerToken(): string {
  return randomBytes(32).toString('base64url')
}
