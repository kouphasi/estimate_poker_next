import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/infrastructure/auth/nextAuthConfig";
import { prisma } from "@/infrastructure/database/prisma";
import { ListProjectSessionsUseCase } from "@/application/project/ListProjectSessionsUseCase";
import { CreateProjectSessionUseCase } from "@/application/project/CreateProjectSessionUseCase";
import { PrismaProjectRepository } from "@/infrastructure/database/repositories/PrismaProjectRepository";
import { PrismaSessionRepository } from "@/infrastructure/database/repositories/PrismaSessionRepository";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/DomainError";

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

    const projectRepository = new PrismaProjectRepository(prisma);
    const sessionRepository = new PrismaSessionRepository(prisma);
    const listProjectSessionsUseCase = new ListProjectSessionsUseCase(
      projectRepository,
      sessionRepository
    );

    const result = await listProjectSessionsUseCase.execute(
      projectId,
      session.user.id
    );

    return NextResponse.json({ sessions: result.sessions });
  } catch (error) {
    console.error("Error fetching project sessions:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: (error as UnauthorizedError).message },
        { status: 403 }
      );
    }

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

    const body = await request.json();
    const { name } = body;

    const projectRepository = new PrismaProjectRepository(prisma);
    const sessionRepository = new PrismaSessionRepository(prisma);
    const createProjectSessionUseCase = new CreateProjectSessionUseCase(
      projectRepository,
      sessionRepository
    );

    const result = await createProjectSessionUseCase.execute({
      projectId,
      requestUserId: session.user.id,
      name,
    });

    return NextResponse.json(
      {
        sessionId: result.sessionId,
        shareToken: result.shareToken,
        ownerToken: result.ownerToken,
        name: result.name,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project session:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: (error as UnauthorizedError).message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
