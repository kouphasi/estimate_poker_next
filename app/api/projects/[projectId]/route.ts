import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[projectId] - プロジェクト詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // 認証チェック
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { projectId } = await params;

    // プロジェクト取得
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        tasks: {
          include: {
            sessions: {
              select: {
                id: true,
                name: true,
                status: true,
                finalEstimate: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
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
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // オーナー権限チェック
    if (project.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // 統計情報を計算
    const totalEstimate = project.tasks.reduce(
      (sum: number, task: any) => sum + (task.finalEstimate || 0),
      0
    );
    const completedTasks = project.tasks.filter(
      (task: any) => task.finalEstimate !== null
    ).length;

    return NextResponse.json({
      ...project,
      stats: {
        taskCount: project.tasks.length,
        completedTaskCount: completedTasks,
        totalEstimate,
        completionRate: project.tasks.length > 0
          ? (completedTasks / project.tasks.length) * 100
          : 0,
      },
    });
  } catch (error) {
    console.error("プロジェクト詳細取得エラー:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[projectId] - プロジェクト更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // 認証チェック
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { projectId } = await params;

    // プロジェクトの存在とオーナー権限チェック
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (existingProject.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    // バリデーション
    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      return NextResponse.json(
        { error: "Invalid project name" },
        { status: 400 }
      );
    }

    // プロジェクト更新
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("プロジェクト更新エラー:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId] - プロジェクト削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // 認証チェック
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { projectId } = await params;

    // プロジェクトの存在とオーナー権限チェック
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (existingProject.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // プロジェクト削除（カスケードでタスクも削除される）
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json(
      { message: "Project deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("プロジェクト削除エラー:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
