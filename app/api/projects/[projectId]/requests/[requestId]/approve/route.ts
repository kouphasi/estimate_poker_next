import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

// POST /api/projects/[projectId]/requests/[requestId]/approve - 参加リクエスト承認
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string; requestId: string }> }
) {
  try {
    const { projectId, requestId } = await context.params;
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

    // 参加リクエスト取得
    const joinRequest = await prisma.projectJoinRequest.findFirst({
      where: {
        id: requestId,
        projectId,
      },
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    if (joinRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    // トランザクションで承認処理
    const result = await prisma.$transaction(async (tx) => {
      // 参加リクエストを承認
      const updatedRequest = await tx.projectJoinRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          respondedAt: new Date(),
          respondedById: session.user.id,
        },
      });

      // プロジェクトメンバーとして追加
      const member = await tx.projectMember.create({
        data: {
          projectId,
          userId: joinRequest.userId,
          role: "MEMBER",
        },
      });

      return { updatedRequest, member };
    });

    return NextResponse.json({
      message: "Join request approved successfully",
      joinRequest: result.updatedRequest,
      member: result.member,
    });
  } catch (error) {
    console.error("Error approving join request:", error);
    return NextResponse.json(
      { error: "Failed to approve join request" },
      { status: 500 }
    );
  }
}
