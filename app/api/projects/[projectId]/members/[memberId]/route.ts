import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/infrastructure/auth/nextAuthConfig';
import { prisma } from '@/infrastructure/database/prisma';

/**
 * DELETE /api/projects/[projectId]/members/[memberId]
 * メンバーをプロジェクトから削除（オーナーのみ）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const { projectId, memberId } = await params;
    const userId = session.user.id;

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

    if (project.ownerId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'プロジェクトオーナーのみがメンバーを削除できます' },
        { status: 403 }
      );
    }

    // メンバーを取得
    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        projectId: true,
        userId: true,
        role: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Not Found', message: 'メンバーが見つかりません' },
        { status: 404 }
      );
    }

    // プロジェクトIDが一致することを確認
    if (member.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Not Found', message: 'メンバーが見つかりません' },
        { status: 404 }
      );
    }

    // オーナーは削除できない
    if (member.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'オーナー自身は削除できません' },
        { status: 400 }
      );
    }

    // メンバーを削除
    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json(
      {
        message: 'メンバーを削除しました',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
