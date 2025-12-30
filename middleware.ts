import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  isProtectedPath,
  checkAuthentication,
  logAuthDebug,
} from "@/application/middleware/authMiddleware";

export default async function middleware(request: NextRequest) {
  // 保護されたパスでない場合はそのまま通す
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Next-Authのトークンをチェック
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Cookieをチェック
  const simpleLoginCookie = request.cookies.get("simple_login_user")?.value;
  const allCookies = request.cookies.getAll();
  const nextAuthCookie = allCookies.find(
    (c) =>
      c.name.includes("next-auth.session-token") ||
      c.name.includes("__Secure-next-auth.session-token")
  )?.value;

  // 認証状態をチェック
  const authResult = checkAuthentication(
    token,
    simpleLoginCookie,
    nextAuthCookie,
    request.nextUrl.pathname
  );

  // デバッグログ出力
  logAuthDebug(request.nextUrl.pathname, allCookies, authResult);

  // 認証されていない場合はリダイレクト
  if (!authResult.isAuthenticated) {
    console.log("[Middleware] No authentication found, redirecting to /");
    const url = new URL("/", request.url);
    return NextResponse.redirect(url);
  }

  // ニックネーム設定が必要な場合はリダイレクト
  if (authResult.needsNicknameSetup) {
    console.log(
      "[Middleware] User needs to set up nickname, redirecting to /setup-nickname"
    );
    const url = new URL("/setup-nickname", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/mypage/:path*", "/projects/:path*"],
};
