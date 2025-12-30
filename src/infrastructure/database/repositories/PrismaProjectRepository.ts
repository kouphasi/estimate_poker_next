import { PrismaClient, Project as PrismaProject } from '@prisma/client';
import { ProjectRepository } from '@/domain/project/ProjectRepository';
import { Project } from '@/domain/project/Project';

/**
 * PrismaProjectRepository
 * ProjectRepositoryのPrisma実装
 */
export class PrismaProjectRepository implements ProjectRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Project | null> {
    const data = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!data) return null;
    return this.toDomain(data);
  }

  async findByOwnerId(ownerId: string): Promise<Project[]> {
    const data = await this.prisma.project.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });

    return data.map((p) => this.toDomain(p));
  }

  async findByIdAndOwnerId(
    projectId: string,
    ownerId: string
  ): Promise<Project | null> {
    const data = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: ownerId,
      },
    });

    if (!data) return null;
    return this.toDomain(data);
  }

  async save(project: Project): Promise<Project> {
    const data = await this.prisma.project.upsert({
      where: { id: project.id },
      update: {
        name: project.name,
        description: project.description,
        updatedAt: new Date(),
      },
      create: {
        id: project.id,
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.project.delete({
      where: { id },
    });
  }

  async countSessions(projectId: string): Promise<number> {
    const count = await this.prisma.estimationSession.count({
      where: { projectId },
    });

    return count;
  }

  /**
   * Prismaモデルからドメインエンティティへの変換
   */
  private toDomain(data: PrismaProject): Project {
    return new Project(
      data.id,
      data.name,
      data.description,
      data.ownerId,
      data.createdAt,
      data.updatedAt
    );
  }
}
