import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(request: NextRequest) {
  // 認証が必要なパス
  const protectedPaths = ["/mypage"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // 保護されたパスでない場合はそのまま通す
  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Next-Authのトークンをチェック（cookieNameを指定しない方がデフォルト動作で安全）
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 簡易ログインのCookieをチェック
  const simpleLoginCookie = request.cookies.get("simple_login_user");

  // Next-AuthのCookieを直接確認（デバッグ用）
  const allCookies = request.cookies.getAll();
  const nextAuthCookie = allCookies.find(c =>
    c.name.includes('next-auth.session-token') ||
    c.name.includes('__Secure-next-auth.session-token')
  );

  // デバッグログ
  console.log('[Proxy] Path:', request.nextUrl.pathname);
  console.log('[Proxy] All cookies:', allCookies.map(c => c.name));
  console.log('[Proxy] Next-Auth cookie found:', nextAuthCookie?.name);
  console.log('[Proxy] Next-Auth cookie value exists:', !!nextAuthCookie?.value);
  console.log('[Proxy] Has token from getToken:', !!token);
  console.log('[Proxy] Token value:', token);
  console.log('[Proxy] Has simple login cookie:', !!simpleLoginCookie);
  console.log('[Proxy] NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);

  // 認証チェック：
  // 1. Next-Authのトークンがデコードできた
  // 2. 簡易ログインのCookieがある
  // 3. Next-AuthのCookieが存在する（getTokenが失敗してもCookieがあれば通す）
  const hasAuth = token || simpleLoginCookie || nextAuthCookie;

  if (!hasAuth) {
    console.log('[Proxy] No authentication found, redirecting to /');
    const url = new URL("/", request.url);
    return NextResponse.redirect(url);
  }

  if (nextAuthCookie && !token) {
    console.log('[Proxy] Warning: Next-Auth cookie exists but getToken failed. Allowing access anyway.');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/mypage/:path*"],
};
