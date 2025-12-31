import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/infrastructure/auth/nextAuthConfig';
import { prisma } from '@/infrastructure/database/prisma';

/**
 * GET /api/users/me/projects
 * 自分がメンバーとして参加しているプロジェクト一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');

    // メンバーシップ情報を取得（オーナーも含める）
    const memberships = await prisma.projectMember.findMany({
      where: {
        userId: session.user.id,
        ...(roleFilter && { role: roleFilter as 'OWNER' | 'MEMBER' }),
      },
      select: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            owner: {
              select: {
                id: true,
                nickname: true,
              },
            },
            _count: {
              select: {
                sessions: true,
              },
            },
          },
        },
        role: true,
        joinedAt: true,
      },
      orderBy: { joinedAt: 'desc' },
    });

    const projects = memberships.map((m: typeof memberships[0]) => ({
      id: m.project.id,
      name: m.project.name,
      description: m.project.description,
      role: m.role,
      owner: m.project.owner,
      joinedAt: m.joinedAt.toISOString(),
      sessionCount: m.project._count.sessions,
    }));

    return NextResponse.json(
      {
        projects,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
