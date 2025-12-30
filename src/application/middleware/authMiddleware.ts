import { NextRequest } from 'next/server';

/**
 * 認証チェック結果
 */
export interface AuthCheckResult {
  isAuthenticated: boolean;
  needsNicknameSetup: boolean;
  hasNextAuthToken: boolean;
  hasSimpleLoginCookie: boolean;
  hasNextAuthCookie: boolean;
  token: any;
}

/**
 * 保護されたパスかどうかを判定
 */
export function isProtectedPath(pathname: string): boolean {
  const protectedPaths = ['/mypage', '/projects'];
  return protectedPaths.some((path) => pathname.startsWith(path));
}

/**
 * 認証状態をチェック
 */
export function checkAuthentication(
  token: any,
  simpleLoginCookie: string | undefined,
  nextAuthCookie: string | undefined,
  pathname: string
): AuthCheckResult {
  const hasNextAuthToken = !!token;
  const hasSimpleLoginCookie = !!simpleLoginCookie;
  const hasNextAuthCookie = !!nextAuthCookie;

  // 認証チェック：
  // 1. Next-Authのトークンがデコードできた
  // 2. 簡易ログインのCookieがある
  // 3. Next-AuthのCookieが存在する（getTokenが失敗してもCookieがあれば通す）
  const isAuthenticated = hasNextAuthToken || hasSimpleLoginCookie || hasNextAuthCookie;

  // ニックネーム設定が必要かチェック
  // （Next-Authユーザーで、nicknameがemailと同じ場合）
  const needsNicknameSetup =
    pathname !== '/setup-nickname' &&
    hasNextAuthToken &&
    token?.nickname &&
    token?.email &&
    token.nickname === token.email;

  return {
    isAuthenticated,
    needsNicknameSetup,
    hasNextAuthToken,
    hasSimpleLoginCookie,
    hasNextAuthCookie,
    token,
  };
}

/**
 * デバッグログを出力
 */
export function logAuthDebug(
  pathname: string,
  cookies: Array<{ name: string; value: string }>,
  result: AuthCheckResult
): void {
  console.log('[Middleware] Path:', pathname);
  console.log('[Middleware] All cookies:', cookies.map((c) => c.name));
  console.log('[Middleware] Has token from getToken:', result.hasNextAuthToken);
  console.log('[Middleware] Token value:', result.token);
  console.log('[Middleware] Has simple login cookie:', result.hasSimpleLoginCookie);
  console.log('[Middleware] Has Next-Auth cookie:', result.hasNextAuthCookie);

  if (result.hasNextAuthCookie && !result.hasNextAuthToken) {
    console.log(
      '[Middleware] Warning: Next-Auth cookie exists but getToken failed. Allowing access anyway.'
    );
  }

  if (!result.isAuthenticated) {
    console.log('[Middleware] No authentication found');
  }

  if (result.needsNicknameSetup) {
    console.log('[Middleware] User needs to set up nickname');
  }
}
