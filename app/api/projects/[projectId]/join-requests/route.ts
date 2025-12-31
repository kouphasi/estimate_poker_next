import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/infrastructure/auth/nextAuthConfig';
import { prisma } from '@/infrastructure/database/prisma';

/**
 * GET /api/projects/[projectId]/join-requests
 * プロジェクトの参加リクエスト一覧を取得（オーナーのみ）
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';

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
        { error: 'Forbidden', message: 'プロジェクトオーナーのみがリクエストを確認できます' },
        { status: 403 }
      );
    }

    // リクエスト一覧を取得
    const requests = await prisma.joinRequest.findMany({
      where: {
        projectId,
        status: status as 'PENDING' | 'APPROVED' | 'REJECTED',
      },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(
      {
        requests,
        count: requests.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching join requests:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[projectId]/join-requests
 * プロジェクトへの参加を申請
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
    const userId = session.user.id;

    // プロジェクトの存在を確認
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

    // オーナー自身の申請をチェック
    if (project.ownerId === userId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'このプロジェクトはあなたがオーナーです' },
        { status: 400 }
      );
    }

    // 既にメンバーかどうかを確認
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'Bad Request', message: '既にこのプロジェクトのメンバーです' },
        { status: 400 }
      );
    }

    // 既に申請済みかどうかを確認
    const existingRequest = await prisma.joinRequest.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Bad Request', message: '既に参加申請済みです' },
        { status: 400 }
      );
    }

    // 参加申請を作成
    const joinRequest = await prisma.joinRequest.create({
      data: {
        projectId,
        userId,
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      {
        id: joinRequest.id,
        status: joinRequest.status,
        createdAt: joinRequest.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating join request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
