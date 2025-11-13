import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 簡易ログインのCookieをチェック
  const simpleLoginCookie = request.cookies.get("simple_login_user");

  // 認証が必要なパス
  const protectedPaths = ["/mypage"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // 認証が必要なパスにアクセスしようとしているが、トークンも簡易ログインCookieもない場合
  if (isProtectedPath && !token && !simpleLoginCookie) {
    const url = new URL("/", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
