import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/infrastructure/auth/nextAuthConfig';
import { prisma } from '@/infrastructure/database/prisma';

/**
 * PATCH /api/projects/[projectId]/join-requests/[requestId]
 * 参加リクエストを承認または拒否
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const { projectId, requestId } = await params;
    const body = await request.json();
    const { action } = body;

    // アクションの検証
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Bad Request', message: '無効なアクションです' },
        { status: 400 }
      );
    }

    // プロジェクトのオーナー権限を確認
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Not Found', message: 'プロジェクトが見つかりません' },
        { status: 404 }
      );
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'プロジェクトオーナーのみがリクエストを処理できます' },
        { status: 403 }
      );
    }

    // リクエストの存在を確認
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        projectId: true,
        userId: true,
        status: true,
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: 'Not Found', message: 'リクエストが見つかりません' },
        { status: 404 }
      );
    }

    // プロジェクトIDが一致することを確認
    if (joinRequest.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Not Found', message: 'リクエストが見つかりません' },
        { status: 404 }
      );
    }

    // 既に処理済みでないか確認
    if (joinRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'このリクエストは既に処理されています' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // ProjectMemberレコードを作成
      const member = await prisma.projectMember.create({
        data: {
          projectId,
          userId: joinRequest.userId,
          role: 'MEMBER',
        },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              nickname: true,
            },
          },
          role: true,
          joinedAt: true,
        },
      });

      // リクエストのステータスを更新
      await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      });

      return NextResponse.json(
        {
          message: '参加を承認しました',
          member: {
            id: member.id,
            userId: joinRequest.userId,
            nickname: member.user.nickname,
            role: member.role,
            joinedAt: member.joinedAt.toISOString(),
          },
        },
        { status: 200 }
      );
    } else {
      // リクエストを削除
      await prisma.joinRequest.delete({
        where: { id: requestId },
      });

      return NextResponse.json(
        {
          message: '参加を拒否しました',
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error processing join request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
