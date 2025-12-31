import { encode } from 'next-auth/jwt';
import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { Page } from '@playwright/test';

/**
 * テスト用ユーザーを作成
 * @param prisma Prismaクライアントインスタンス
 * @param data ユーザーデータ
 * @returns 作成されたユーザー
 */
export async function createTestUser(
  prisma: PrismaClient,
  data: {
    email?: string;
    nickname: string;
    isGuest?: boolean;
  }
): Promise<User> {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      nickname: data.nickname,
      isGuest: data.isGuest ?? !data.email,
      passwordHash: data.email
        ? await bcrypt.hash('testpassword123', 10)
        : null,
    },
  });
  return user;
}

/**
 * NextAuth用のJWTトークンを生成
 * @param userId ユーザーID
 * @returns JWTトークン
 */
export async function generateAuthToken(userId: string): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET || 'test-secret-key-for-testing';
  const token = await encode({
    token: {
      id: userId,
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30日
    },
    secret,
  });
  return token;
}

/**
 * Playwrightページで認証ユーザーとしてログイン
 * @param page Playwrightページオブジェクト
 * @param userId ユーザーID
 */
export async function authenticateUser(page: Page, userId: string): Promise<void> {
  const token = await generateAuthToken(userId);
  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    },
  ]);
}

/**
 * ゲストユーザー用のクッキーを設定
 * @param page Playwrightページオブジェクト
 * @param nickname ニックネーム
 * @param userId ユーザーID
 */
export async function setGuestUserCookie(
  page: Page,
  nickname: string,
  userId: string
): Promise<void> {
  const guestData = JSON.stringify({
    id: userId,
    nickname,
    isGuest: true,
  });

  await page.context().addCookies([
    {
      name: 'simple_login_user',
      value: guestData,
      domain: 'localhost',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7日
    },
  ]);
}
