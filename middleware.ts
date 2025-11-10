export { default } from "next-auth/middleware";

// 認証が必要なページを指定
export const config = {
  matcher: [
    "/mypage/:path*",
  ],
};
