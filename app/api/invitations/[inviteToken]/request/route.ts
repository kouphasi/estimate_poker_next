import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

// POST /api/invitations/[inviteToken]/request - 参加リクエスト送信
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ inviteToken: string }> }
) {
  try {
    const { inviteToken } = await context.params;
    const session = await getServerSession(authOptions);

    // 認証済みユーザーのみ参加リクエスト可能
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to request joining a project" },
        { status: 401 }
      );
    }

    // ゲストユーザーは参加不可
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isGuest: true },
    });

    if (user?.isGuest) {
      return NextResponse.json(
        { error: "Guest users cannot join projects. Please create an account." },
        { status: 403 }
      );
    }

    // 招待リンク取得
    const invitation = await prisma.projectInvitation.findUnique({
      where: { inviteToken },
      include: {
        project: true,
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

    // 有効期限チェック
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 410 }
      );
    }

    const projectId = invitation.projectId;

    // プロジェクトオーナーは参加リクエスト不要
    if (invitation.project.ownerId === session.user.id) {
      return NextResponse.json(
        { error: "You are already the owner of this project" },
        { status: 400 }
      );
    }

    // 既にメンバーかチェック
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this project" },
        { status: 400 }
      );
    }

    // 既に参加リクエスト済みかチェック
    const existingRequest = await prisma.projectJoinRequest.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user.id,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === "PENDING") {
        return NextResponse.json(
          { error: "You have already requested to join this project" },
          { status: 400 }
        );
      } else if (existingRequest.status === "REJECTED") {
        // 拒否された場合は再リクエスト可能
        const updatedRequest = await prisma.projectJoinRequest.update({
          where: { id: existingRequest.id },
          data: {
            status: "PENDING",
            requestedAt: new Date(),
            respondedAt: null,
            respondedById: null,
          },
        });

        return NextResponse.json({
          joinRequest: {
            id: updatedRequest.id,
            status: updatedRequest.status,
            requestedAt: updatedRequest.requestedAt,
          },
        });
      }
    }

    // 参加リクエスト作成
    const joinRequest = await prisma.projectJoinRequest.create({
      data: {
        projectId,
        userId: session.user.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      joinRequest: {
        id: joinRequest.id,
        status: joinRequest.status,
        requestedAt: joinRequest.requestedAt,
      },
    });
  } catch (error) {
    console.error("Error creating join request:", error);
    return NextResponse.json(
      { error: "Failed to create join request" },
      { status: 500 }
    );
  }
}
