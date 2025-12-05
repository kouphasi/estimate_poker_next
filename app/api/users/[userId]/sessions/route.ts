import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // ユーザーが存在するか確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // ユーザーが作成したセッション一覧を取得
    const sessions = await prisma.estimationSession.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        shareToken: true,
        status: true,
        createdAt: true,
        finalEstimate: true,
        isRevealed: true,
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    // 詳細なエラー情報をサーバーログに記録
    console.error('Error fetching user sessions:', {
      error,
      userId: (await params).userId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
