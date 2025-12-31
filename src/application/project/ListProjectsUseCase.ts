import { ProjectRepository } from "@/domain/project/ProjectRepository";

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  sessionsCount: number;
}

/**
 * プロジェクト一覧取得ユースケース
 *
 * ビジネスルール:
 * - 認証済みユーザーのみがプロジェクトを取得可能
 * - 自分が所有するプロジェクトのみ取得
 */
export class ListProjectsUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(ownerId: string): Promise<ProjectSummary[]> {
    const projects = await this.projectRepository.findByOwnerId(ownerId);

    const projectSummaries = await Promise.all(
      projects.map(async (project) => {
        const sessionsCount = await this.projectRepository.countSessions(project.id);
        return {
          id: project.id,
          name: project.name,
          description: project.description,
          ownerId: project.ownerId,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          sessionsCount,
        };
      })
    );

    return projectSummaries;
  }
}
