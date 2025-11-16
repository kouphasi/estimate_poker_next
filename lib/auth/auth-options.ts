import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  debug: true, // 本番環境でもデバッグログを有効化して問題を特定
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          // GitHub ユーザーは isGuest: false
          isGuest: false,
          nickname: profile.name || profile.login,
        };
      },
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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      // GitHubログインの場合、accountが存在する
      if (account?.provider === "github") {
        token.isGitHubUser = true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // GitHubログインの場合、Userレコードの更新
      if (account?.provider === "github" && user.email) {
        try {
          // GitHubプロファイルのloginプロパティを取得
          const githubLogin =
            (profile && typeof profile === 'object' && 'login' in profile)
              ? String(profile.login)
              : undefined;

          // GitHubログインの場合、isGuestをfalseに設定
          await prisma.user.update({
            where: { id: user.id },
            data: {
              isGuest: false,
              nickname: user.name || githubLogin || "GitHub User",
            },
          });
        } catch (error) {
          console.error("Failed to update user on GitHub sign in:", error);
          // サインインは継続
        }
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
