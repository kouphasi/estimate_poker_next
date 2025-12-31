import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/projects/[projectId]/members
 * プロジェクトのメンバー一覧を取得（オーナーまたはメンバー）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const { projectId } = await params;
    const userId = session.user.id;

    // プロジェクトを取得
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

    // ユーザーがメンバーまたはオーナーであることを確認
    const isMember = userId === project.ownerId;
    if (!isMember) {
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      if (!member) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'プロジェクトメンバーのみが一覧を確認できます' },
          { status: 403 }
        );
      }
    }

    // メンバー一覧を取得
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
        role: true,
        joinedAt: true,
      },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json(
      {
        members,
        count: members.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
