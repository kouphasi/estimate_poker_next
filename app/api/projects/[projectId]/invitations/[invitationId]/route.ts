import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

// DELETE /api/projects/[projectId]/invitations/[invitationId] - 招待リンク無効化
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ projectId: string; invitationId: string }> }
) {
  try {
    const { projectId, invitationId } = await context.params;
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

    // 招待リンクの存在確認
    const invitation = await prisma.projectInvitation.findFirst({
      where: {
        id: invitationId,
        projectId,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // 招待リンクを無効化
    await prisma.projectInvitation.update({
      where: { id: invitationId },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: "Invitation deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating invitation:", error);
    return NextResponse.json(
      { error: "Failed to deactivate invitation" },
      { status: 500 }
    );
  }
}
