import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/infrastructure/database/prisma";
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
        console.log('[NextAuth] signIn callback - Google OAuth attempt for:', user.email);

        // 既存のユーザーを検索
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true }
        });

        if (existingUser) {
          console.log('[NextAuth] Existing user found:', existingUser.id);

          // Google Accountが既にリンクされているか確認
          const googleAccount = existingUser.accounts.find(
            acc => acc.provider === "google" && acc.providerAccountId === account.providerAccountId
          );

          if (!googleAccount) {
            // Accountレコードを手動で作成してリンク
            console.log('[NextAuth] Linking Google account to existing user');
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              }
            });
          }

          // ユーザー情報を更新（isGuestをfalseに）
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              isGuest: false,
            }
          });

          // user.idを既存ユーザーのIDに設定（重要！）
          user.id = existingUser.id;
        } else {
          // 新規ユーザーの場合はPrismaAdapterが処理するが、
          // nicknameフィールドはPrismaAdapterが知らないので手動で作成
          console.log('[NextAuth] New user, creating manually with email as temporary nickname');

          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              nickname: user.email!, // 一時的にemailをnicknameに設定（後で変更してもらう）
              isGuest: false,
            }
          });

          // Accountレコードを作成
          await prisma.account.create({
            data: {
              userId: newUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            }
          });

          // user.idを新規ユーザーのIDに設定
          user.id = newUser.id;
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // OAuth認証後のリダイレクトを制御
      console.log('[NextAuth] redirect callback - url:', url, 'baseUrl:', baseUrl);

      // /setup-nicknameへのリダイレクトはそのまま許可
      if (url.includes('/setup-nickname')) {
        return url.startsWith('/') ? `${baseUrl}${url}` : url;
      }

      // callbackUrlが指定されている場合は、それに従う
      // 絶対パス（/mypage等）の場合
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log('[NextAuth] Redirecting to absolute path:', redirectUrl);
        return redirectUrl;
      }

      // 完全なURL（baseUrlを含む）の場合
      if (url.startsWith(baseUrl)) {
        console.log('[NextAuth] Redirecting to full URL:', url);
        return url;
      }

      // それ以外の外部URL（セキュリティのため拒否してbaseUrlにリダイレクト）
      console.log('[NextAuth] External URL detected, redirecting to /mypage');
      return `${baseUrl}/mypage`;
    },
    async jwt({ token, user, trigger }) {
      // jwtコールバックではDB更新を削除（signInで完了しているため）
      if (user) {
        token.id = user.id;
      }

      // トークンにnicknameとemailを含める（ミドルウェアで使用）
      // trigger === 'update'の場合は、DBから最新情報を取得
      if (token.id && (trigger === 'update' || !token.nickname)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { nickname: true, email: true }
        });

        if (dbUser) {
          token.nickname = dbUser.nickname;
          token.email = dbUser.email || undefined;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.nickname = token.nickname;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
