import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 環境変数のバリデーション
if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('GOOGLE_CLIENT_SECRET is required when GOOGLE_CLIENT_ID is set');
}

export const authOptions: NextAuthOptions = {
  // GoogleProviderが有効な場合のみadapterを使用
  // CredentialsProviderのみの場合はadapterは不要
  ...(process.env.GOOGLE_CLIENT_ID ? { adapter: PrismaAdapter(prisma) } : {}),
  debug: true, // 本番環境でもデバッグログを有効化して問題を特定
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            profile(profile) {
              return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
              };
            },
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("メールアドレスとパスワードを入力してください");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.passwordHash) {
          throw new Error("メールアドレスまたはパスワードが正しくありません");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("メールアドレスまたはパスワードが正しくありません");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  pages: {
    signIn: "/login",
    signOut: "/",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Google OAuth経由でサインインする場合
      if (account?.provider === "google" && user.email) {
        // サインイン時に1回だけ更新（重複DB更新を防ぐ）
        const nickname = profile?.name || user.name || user.email.split('@')[0] || 'User';

        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            isGuest: false,
            nickname: nickname,
          },
          create: {
            email: user.email,
            nickname: nickname,
            isGuest: false,
          }
        });
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // OAuth認証後のリダイレクトを制御
      // /loginページからの認証の場合は/mypageにリダイレクト
      if (url.startsWith(baseUrl)) {
        // 相対URLの場合
        return url;
      } else if (url.startsWith("/")) {
        // 絶対パスの場合
        return `${baseUrl}${url}`;
      }
      // 外部URLからのコールバック（OAuth）の場合は/mypageへ
      return `${baseUrl}/mypage`;
    },
    async jwt({ token, user }) {
      // jwtコールバックではDB更新を削除（signInで完了しているため）
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
