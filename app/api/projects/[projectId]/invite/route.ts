import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';
import { InviteToken } from '@/src/domain/project/InviteToken';

/**
 * POST /api/projects/[projectId]/invite
 * 招待URL発行（または再発行）
 */
export async function POST(
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

    // プロジェクトの存在とオーナー権限を確認
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Not Found', message: 'プロジェクトが見つかりません' },
        { status: 404 }
      );
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'プロジェクトオーナーのみが招待URLを発行できます' },
        { status: 403 }
      );
    }

    // 招待トークンを生成
    const inviteToken = InviteToken.generate();

    // 既存の招待レコードを更新、または新規作成
    const invite = await prisma.projectInvite.upsert({
      where: { projectId },
      update: {
        token: inviteToken.value,
        updatedAt: new Date(),
      },
      create: {
        projectId,
        token: inviteToken.value,
      },
    });

    // 招待URLを生成
    const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const inviteUrl = `${baseUrl}/invite/${invite.token}`;

    return NextResponse.json(
      {
        inviteUrl,
        token: invite.token,
        createdAt: invite.createdAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating project invite:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
