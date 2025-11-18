import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/projects - プロジェクト一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // 認証チェック
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ユーザーのプロジェクト一覧を取得
    const projects = await prisma.project.findMany({
      where: {
        ownerId: session.user.id,
      },
      include: {
        tasks: {
          select: {
            id: true,
            finalEstimate: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // プロジェクトごとの統計情報を計算
    const projectsWithStats = projects.map((project: any) => {
      const totalEstimate = project.tasks.reduce(
        (sum: number, task: any) => sum + (task.finalEstimate || 0),
        0
      );
      const completedTasks = project.tasks.filter(
        (task: any) => task.finalEstimate !== null
      ).length;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        taskCount: project._count.tasks,
        completedTaskCount: completedTasks,
        totalEstimate,
      };
    });

    return NextResponse.json(projectsWithStats);
  } catch (error) {
    console.error("プロジェクト一覧取得エラー:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects - プロジェクト作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // 認証チェック
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ゲストユーザーはプロジェクトを作成できない
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isGuest: true },
    });

    if (user?.isGuest) {
      return NextResponse.json(
        { error: "Guest users cannot create projects" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    // バリデーション
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // プロジェクト作成
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("プロジェクト作成エラー:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
