import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/infrastructure/database/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { nickname } = body;

    // ニックネームのバリデーション
    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      return NextResponse.json(
        { error: 'ニックネームを入力してください' },
        { status: 400 }
      );
    }

    if (nickname.trim().length > 50) {
      return NextResponse.json(
        { error: 'ニックネームは50文字以内で入力してください' },
        { status: 400 }
      );
    }

    // 認証チェック
    const session = await getServerSession(authOptions);

    console.log('Nickname update request:', {
      userId,
      hasSession: !!session,
      sessionUserId: session?.user?.id,
    });

    let isAuthorized = false;

    // Next-Authセッションがある場合は、ユーザーIDが一致するか確認
    if (session?.user) {
      const sessionUser = session.user as { id?: string };
      if (sessionUser.id === userId) {
        isAuthorized = true;
        console.log('Authorized via NextAuth session');
      }
    }

    // NextAuthセッションでの認証が失敗した場合、簡易ログインをチェック
    if (!isAuthorized) {
      const cookieUserId = request.cookies.get('simple_login_user')?.value;
      console.log('Checking simple login cookie:', { hasCookie: !!cookieUserId });

      if (cookieUserId) {
        try {
          const userData = JSON.parse(cookieUserId);
          if (userData.userId === userId) {
            isAuthorized = true;
            console.log('Authorized via simple login cookie');
          }
        } catch (err) {
          console.error('Failed to parse simple login cookie:', err);
        }
      }
    }

    if (!isAuthorized) {
      console.log('Authorization failed for userId:', userId);
      return NextResponse.json(
        { error: 'ログインが必要です、または他のユーザーのニックネームは変更できません' },
        { status: 401 }
      );
    }

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // ニックネームを更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { nickname: nickname.trim() },
    });

    return NextResponse.json({
      userId: updatedUser.id,
      nickname: updatedUser.nickname,
    });
  } catch (error) {
    console.error('Error updating nickname:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'ニックネームの更新に失敗しました' },
      { status: 500 }
    );
  }
}
