import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/invite/[token]
 * 招待トークンからプロジェクト情報を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const { token } = await params;

    // 招待トークンからプロジェクト情報を取得
    const invite = await prisma.projectInvite.findUnique({
      where: { token },
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
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: 'Not Found', message: 'この招待URLは無効です' },
        { status: 404 }
      );
    }

    const projectId = invite.project.id;
    const userId = session.user.id;

    // ユーザーのプロジェクトに対するステータスを確認
    let userStatus: 'none' | 'pending' | 'member' | 'owner' = 'none';

    if (userId === invite.project.owner.id) {
      userStatus = 'owner';
    } else {
      // メンバーかどうか確認
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      if (member) {
        userStatus = 'member';
      } else {
        // 申請済みかどうか確認
        const joinRequest = await prisma.joinRequest.findUnique({
          where: {
            projectId_userId: {
              projectId,
              userId,
            },
          },
        });

        if (joinRequest) {
          userStatus = 'pending';
        }
      }
    }

    return NextResponse.json(
      {
        project: invite.project,
        userStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching invite info:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
