import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/invitations/[inviteToken] - 招待情報取得
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ inviteToken: string }> }
) {
  try {
    const { inviteToken } = await context.params;

    // 招待リンク取得
    const invitation = await prisma.projectInvitation.findUnique({
      where: {
        inviteToken,
      },
      include: {
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

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (!invitation.isActive) {
      return NextResponse.json(
        { error: "Invitation is no longer active" },
        { status: 410 }
      );
    }

    // 有効期限チェック（設定されている場合）
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        project: invitation.project,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 }
    );
  }
}
