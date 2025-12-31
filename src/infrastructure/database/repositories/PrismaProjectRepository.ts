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
    // プロジェクトが既に存在するかチェック
    const existingProject = await this.prisma.project.findUnique({
      where: { id: project.id },
    });

    if (existingProject) {
      // 更新の場合
      const data = await this.prisma.project.update({
        where: { id: project.id },
        data: {
          name: project.name,
          description: project.description,
          updatedAt: new Date(),
        },
      });
      return this.toDomain(data);
    } else {
      // 新規作成の場合 - トランザクションでProjectとProjectMemberを同時作成
      const data = await this.prisma.$transaction(async (tx) => {
        // プロジェクトを作成
        const newProject = await tx.project.create({
          data: {
            id: project.id,
            name: project.name,
            description: project.description,
            ownerId: project.ownerId,
          },
        });

        // オーナーをProjectMemberとして登録
        await tx.projectMember.create({
          data: {
            projectId: newProject.id,
            userId: newProject.ownerId,
            role: 'OWNER',
          },
        });

        return newProject;
      });

      return this.toDomain(data);
    }
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
