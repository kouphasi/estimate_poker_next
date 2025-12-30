import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/infrastructure/auth/nextAuthConfig";
import { prisma } from "@/infrastructure/database/prisma";
import { ListProjectsUseCase } from "@/application/project/ListProjectsUseCase";
import { CreateProjectUseCase } from "@/application/project/CreateProjectUseCase";
import { PrismaProjectRepository } from "@/infrastructure/database/repositories/PrismaProjectRepository";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";
import { NotFoundError, UnauthorizedError, ValidationError } from "@/domain/errors/DomainError";

// GET /api/projects - プロジェクト一覧取得
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please login to view projects." },
        { status: 401 }
      );
    }

    const projectRepository = new PrismaProjectRepository(prisma);
    const listProjectsUseCase = new ListProjectsUseCase(projectRepository);

    const projects = await listProjectsUseCase.execute(session.user.id);

    return NextResponse.json({ projects });
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

    const projectRepository = new PrismaProjectRepository(prisma);
    const userRepository = new PrismaUserRepository(prisma);
    const createProjectUseCase = new CreateProjectUseCase(projectRepository, userRepository);

    const project = await createProjectUseCase.execute({
      name,
      description,
      ownerId: session.user.id,
    });

    return NextResponse.json({
      projectId: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: (error as ValidationError).message },
        { status: 400 }
      );
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: (error as UnauthorizedError).message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
