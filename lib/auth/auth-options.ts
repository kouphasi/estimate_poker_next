import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  // OAuthプロバイダーを使用する場合はadapterが必要
  adapter: PrismaAdapter(prisma),
  debug: true, // 本番環境でもデバッグログを有効化して問題を特定
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
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
    async signIn({ user, account }) {
      // Google OAuth経由でサインインする場合
      if (account?.provider === "google") {
        // Prisma Adapterが自動的にユーザーを作成するが、
        // isGuestをfalseに設定し、nicknameを設定する必要がある
        if (user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          });

          if (existingUser) {
            // 既存のユーザーがいる場合、isGuestをfalseに更新
            await prisma.user.update({
              where: { email: user.email },
              data: {
                isGuest: false,
                nickname: user.name || existingUser.nickname
              }
            });
          } else {
            // 新規ユーザーの場合は、Adapterが作成した後に更新
            // Adapterがユーザーを作成するのを待つ必要があるため、
            // ここでは何もせず、後続の処理で更新する
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;

        // Google OAuth経由で新規作成された場合
        if (account?.provider === "google") {
          // isGuestをfalseに更新
          await prisma.user.update({
            where: { id: user.id },
            data: {
              isGuest: false,
              nickname: user.name || user.email?.split('@')[0] || 'User'
            }
          });
        }
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
