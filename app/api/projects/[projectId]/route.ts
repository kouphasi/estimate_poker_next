import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[projectId] - プロジェクト詳細取得
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

    const userId = session.user.id;

    // プロジェクトを取得（オーナーまたはメンバーのみ）
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId }, // オーナー
          {
            members: { // メンバー
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      include: {
        sessions: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            _count: {
              select: {
                estimates: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or you don't have access" },
        { status: 404 }
      );
    }

    // ユーザーの役割を追加
    const role = project.ownerId === userId ? "owner" : "member";

    return NextResponse.json({
      project: {
        ...project,
        role,
      },
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[projectId] - プロジェクト更新
export async function PATCH(
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

    const body = await request.json();
    const { name, description } = body;

    // バリデーション
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return NextResponse.json(
          { error: "Project name cannot be empty" },
          { status: 400 }
        );
      }
    }

    // 更新データの準備
    const updateData: { name?: string; description?: string | null } = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    // オーナーチェックを含めた更新
    const project = await prisma.project.updateMany({
      where: {
        id: projectId,
        ownerId: session.user.id, // オーナーのみ更新可能
      },
      data: updateData,
    });

    if (project.count === 0) {
      return NextResponse.json(
        { error: "Project not found or you are not the owner" },
        { status: 404 }
      );
    }

    // 更新後のデータを取得して返す
    const updatedProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId] - プロジェクト削除
export async function DELETE(
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

    // プロジェクトの存在確認とオーナー確認、セッション数も取得
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id, // オーナーのみ削除可能
      },
      include: {
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or you are not the owner" },
        { status: 404 }
      );
    }

    // プロジェクトを削除（関連するセッションもカスケード削除される）
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json(
      {
        message: "Project deleted successfully",
        deletedSessionsCount: project._count.sessions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
