import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { generateInviteToken } from "@/lib/utils";

// POST /api/projects/[projectId]/invitations - 招待URL作成
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // プロジェクトの存在確認とオーナー確認
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or you are not the owner" },
        { status: 404 }
      );
    }

    // 招待トークン生成（ユニークになるまでリトライ）
    let inviteToken = "";
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
      inviteToken = generateInviteToken();
      const existing = await prisma.projectInvitation.findUnique({
        where: { inviteToken },
      });

      if (!existing) {
        break;
      }
      retries++;
    }

    if (!inviteToken || retries >= maxRetries) {
      return NextResponse.json(
        { error: "Failed to generate unique invite token" },
        { status: 500 }
      );
    }

    // 招待リンク作成
    const invitation = await prisma.projectInvitation.create({
      data: {
        projectId,
        inviteToken,
        createdById: session.user.id,
        isActive: true,
      },
    });

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        inviteToken: invitation.inviteToken,
        createdAt: invitation.createdAt,
        isActive: invitation.isActive,
      },
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}

// GET /api/projects/[projectId]/invitations - 招待リスト取得
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // プロジェクトの存在確認とオーナー確認
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or you are not the owner" },
        { status: 404 }
      );
    }

    // 招待リスト取得
    const invitations = await prisma.projectInvitation.findMany({
      where: {
        projectId,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        createdBy: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
