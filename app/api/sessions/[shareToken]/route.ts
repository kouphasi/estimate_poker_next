import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    // セッションを取得してオーナーか確認
    const session = await prisma.estimationSession.findUnique({
      where: { shareToken },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // オーナーのみ削除可能
    if (session.ownerId !== userId) {
      return NextResponse.json(
        { error: 'Only the owner can delete this session' },
        { status: 403 }
      );
    }

    // セッション削除
    await prisma.estimationSession.delete({
      where: { shareToken },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // 詳細なエラー情報をサーバーログに記録
    console.error('Error deleting session:', {
      error,
      shareToken: (await params).shareToken,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
