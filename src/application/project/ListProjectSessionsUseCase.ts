import { SessionRepository } from "@/domain/session/SessionRepository";
import { ProjectRepository } from "@/domain/project/ProjectRepository";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/DomainError";

export interface SessionSummary {
  id: string;
  name: string | null;
  shareToken: string;
  status: string;
  createdAt: Date;
  estimatesCount: number;
}

export interface ListProjectSessionsOutput {
  sessions: SessionSummary[];
}

/**
 * プロジェクト配下のセッション一覧取得ユースケース
 *
 * ビジネスルール:
 * - プロジェクトのオーナーのみがセッション一覧を閲覧可能
 */
export class ListProjectSessionsUseCase {
  constructor(
    private projectRepository: ProjectRepository,
    private sessionRepository: SessionRepository
  ) {}

  async execute(
    projectId: string,
    requestUserId: string
  ): Promise<ListProjectSessionsOutput> {
    // プロジェクト取得
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new NotFoundError(`Project not found: ${projectId}`);
    }

    // オーナー確認
    if (!project.isOwnedBy(requestUserId)) {
      throw new UnauthorizedError("You are not the owner of this project");
    }

    // プロジェクト配下のセッション取得
    const sessions = await this.sessionRepository.findByProjectId(projectId);

    return {
      sessions: sessions.map((session) => ({
        id: session.id,
        name: session.name,
        shareToken: session.shareToken.value,
        status: session.status,
        createdAt: session.createdAt,
        estimatesCount: 0, // Note: This will need to be populated from estimate repository
      })),
    };
  }
}
