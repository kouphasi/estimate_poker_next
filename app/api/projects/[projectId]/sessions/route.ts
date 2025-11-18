import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { generateShareToken, generateOwnerToken } from "@/lib/utils";

// GET /api/projects/[projectId]/sessions - プロジェクト配下のセッション一覧取得
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
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden. You are not the owner of this project." },
        { status: 403 }
      );
    }

    const sessions = await prisma.estimationSession.findMany({
      where: {
        projectId: projectId,
      },
      include: {
        _count: {
          select: {
            estimates: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching project sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/sessions - プロジェクト配下にセッション作成
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
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden. You are not the owner of this project." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    const shareToken = await generateShareToken();
    const ownerToken = await generateOwnerToken();

    const estimationSession = await prisma.estimationSession.create({
      data: {
        name: name?.trim() || null,
        shareToken,
        ownerToken,
        ownerId: session.user.id,
        projectId: projectId,
      },
    });

    return NextResponse.json(
      {
        sessionId: estimationSession.id,
        shareToken: estimationSession.shareToken,
        ownerToken: estimationSession.ownerToken,
        name: estimationSession.name,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
