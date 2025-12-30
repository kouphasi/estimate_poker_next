import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/infrastructure/auth/nextAuthConfig";
import { prisma } from "@/infrastructure/database/prisma";
import { GetProjectUseCase } from "@/application/project/GetProjectUseCase";
import { UpdateProjectUseCase } from "@/application/project/UpdateProjectUseCase";
import { DeleteProjectUseCase } from "@/application/project/DeleteProjectUseCase";
import { PrismaProjectRepository } from "@/infrastructure/database/repositories/PrismaProjectRepository";
import { PrismaSessionRepository } from "@/infrastructure/database/repositories/PrismaSessionRepository";
import { NotFoundError, UnauthorizedError, ValidationError } from "@/domain/errors/DomainError";

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

    const projectRepository = new PrismaProjectRepository(prisma);
    const sessionRepository = new PrismaSessionRepository(prisma);
    const getProjectUseCase = new GetProjectUseCase(projectRepository, sessionRepository);

    const project = await getProjectUseCase.execute(projectId, session.user.id);

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error fetching project:", error);

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

    const projectRepository = new PrismaProjectRepository(prisma);
    const updateProjectUseCase = new UpdateProjectUseCase(projectRepository);

    const project = await updateProjectUseCase.execute({
      projectId,
      requestUserId: session.user.id,
      name,
      description,
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error updating project:", error);

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

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: (error as ValidationError).message },
        { status: 400 }
      );
    }

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

    const projectRepository = new PrismaProjectRepository(prisma);
    const deleteProjectUseCase = new DeleteProjectUseCase(projectRepository);

    await deleteProjectUseCase.execute({
      projectId,
      requestUserId: session.user.id,
    });

    return NextResponse.json(
      {
        message: "Project deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting project:", error);

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
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
