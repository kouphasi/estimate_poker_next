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

  // Next-Authのトークンをチェック
  const secureCookieName = process.env.NODE_ENV === 'production'
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: secureCookieName,
  });

  // 簡易ログインのCookieをチェック
  const simpleLoginCookie = request.cookies.get("simple_login_user");

  // デバッグログ（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('[Proxy] Path:', request.nextUrl.pathname);
    console.log('[Proxy] Cookie name:', secureCookieName);
    console.log('[Proxy] All cookies:', request.cookies.getAll().map(c => c.name));
    console.log('[Proxy] Has token:', !!token);
    console.log('[Proxy] Token value:', token);
    console.log('[Proxy] Has simple login cookie:', !!simpleLoginCookie);
  }

  // トークンも簡易ログインCookieもない場合はリダイレクト
  if (!token && !simpleLoginCookie) {
    console.log('[Proxy] No authentication found, redirecting to /');
    const url = new URL("/", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/mypage/:path*"],
};
