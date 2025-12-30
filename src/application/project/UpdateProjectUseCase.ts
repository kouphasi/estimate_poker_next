import { ProjectRepository } from "@/domain/project/ProjectRepository";
import { NotFoundError, UnauthorizedError, ValidationError } from "@/domain/errors/DomainError";

export interface UpdateProjectInput {
  projectId: string;
  requestUserId: string;
  name?: string;
  description?: string;
}

export interface UpdateProjectOutput {
  id: string;
  name: string;
  description: string | null;
  updatedAt: Date;
}

/**
 * プロジェクト更新ユースケース
 *
 * ビジネスルール:
 * - プロジェクトのオーナーのみが更新可能
 * - プロジェクト名が更新される場合、空文字は不可
 */
export class UpdateProjectUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(input: UpdateProjectInput): Promise<UpdateProjectOutput> {
    // プロジェクト取得
    const project = await this.projectRepository.findById(input.projectId);

    if (!project) {
      throw new NotFoundError(`Project not found: ${input.projectId}`);
    }

    // オーナー確認
    if (!project.isOwnedBy(input.requestUserId)) {
      throw new UnauthorizedError("You are not the owner of this project");
    }

    // バリデーション
    if (input.name !== undefined && input.name.trim() === "") {
      throw new ValidationError("Project name cannot be empty");
    }

    // プロジェクト更新
    const updatedProject = project.update({
      name: input.name?.trim(),
      description: input.description !== undefined ? (input.description?.trim() || null) : undefined,
    });

    // 永続化
    const saved = await this.projectRepository.save(updatedProject);

    return {
      id: saved.id,
      name: saved.name,
      description: saved.description,
      updatedAt: saved.updatedAt,
    };
  }
}
