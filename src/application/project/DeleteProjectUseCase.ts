import { ProjectRepository } from "@/domain/project/ProjectRepository";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/DomainError";

export interface DeleteProjectInput {
  projectId: string;
  requestUserId: string;
}

/**
 * プロジェクト削除ユースケース
 *
 * ビジネスルール:
 * - プロジェクトのオーナーのみが削除可能
 * - プロジェクト削除時、関連するセッションもカスケード削除される
 */
export class DeleteProjectUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(input: DeleteProjectInput): Promise<void> {
    // プロジェクト取得
    const project = await this.projectRepository.findById(input.projectId);

    if (!project) {
      throw new NotFoundError(`Project not found: ${input.projectId}`);
    }

    // オーナー確認
    if (!project.canBeDeletedBy(input.requestUserId)) {
      throw new UnauthorizedError("You are not the owner of this project");
    }

    // プロジェクト削除
    await this.projectRepository.delete(input.projectId);
  }
}
