import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET /api/projects - プロジェクト一覧取得（オーナーとメンバー両方）
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please login to view projects." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // オーナーとして所有しているプロジェクト
    const ownedProjects = await prisma.project.findMany({
      where: {
        ownerId: userId,
      },
      include: {
        _count: {
          select: {
            sessions: true,
          },
        },
        owner: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // メンバーとして参加しているプロジェクト
    const memberProjects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        _count: {
          select: {
            sessions: true,
          },
        },
        owner: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // オーナーかメンバーかのフラグを追加
    const projectsWithRole = [
      ...ownedProjects.map((p) => ({ ...p, role: "owner" as const })),
      ...memberProjects.map((p) => ({ ...p, role: "member" as const })),
    ];

    return NextResponse.json({ projects: projectsWithRole });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - プロジェクト作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Only authenticated users can create projects." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json({
      projectId: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
