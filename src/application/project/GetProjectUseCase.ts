import { ProjectRepository } from "@/domain/project/ProjectRepository";
import { SessionRepository } from "@/domain/session/SessionRepository";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/DomainError";

export interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  sessions: Array<{
    id: string;
    name: string | null;
    shareToken: string;
    status: string;
    createdAt: Date;
    estimatesCount: number;
  }>;
  owner: {
    id: string;
    nickname: string;
    email: string | null;
  };
}

/**
 * プロジェクト詳細取得ユースケース
 *
 * ビジネスルール:
 * - プロジェクトのオーナーのみが詳細を閲覧可能
 */
export class GetProjectUseCase {
  constructor(
    private projectRepository: ProjectRepository,
    private sessionRepository: SessionRepository
  ) {}

  async execute(projectId: string, requestUserId: string): Promise<ProjectDetail> {
    // プロジェクト取得
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new NotFoundError(`Project not found: ${projectId}`);
    }

    // オーナー確認
    if (!project.isOwnedBy(requestUserId)) {
      throw new UnauthorizedError("You are not the owner of this project");
    }

    // プロジェクトに紐づくセッションを取得
    const sessions = await this.sessionRepository.findByProjectId(projectId);

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      sessions: sessions.map((session) => ({
        id: session.id,
        name: session.name,
        shareToken: session.shareToken.value,
        status: session.status,
        createdAt: session.createdAt,
        estimatesCount: 0, // Note: This will need to be populated separately
      })),
      owner: {
        id: project.ownerId,
        nickname: "", // Note: This will need to be populated from user repository
        email: null,
      },
    };
  }
}
