import { SessionRepository } from "@/domain/session/SessionRepository";
import { ShareToken } from "@/domain/session/ShareToken";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/DomainError";

export interface DeleteSessionInput {
  shareToken: string;
  ownerToken: string;
}

/**
 * セッション削除ユースケース
 *
 * ビジネスルール:
 * - セッションのオーナーのみが削除可能
 * - OwnerTokenで権限確認
 */
export class DeleteSessionUseCase {
  constructor(private sessionRepository: SessionRepository) {}

  async execute(input: DeleteSessionInput): Promise<void> {
    // ShareTokenでセッションを検索
    const shareToken = ShareToken.fromString(input.shareToken);
    const session = await this.sessionRepository.findByShareToken(shareToken);

    if (!session) {
      throw new NotFoundError(`Session not found with shareToken: ${input.shareToken}`);
    }

    // オーナー権限確認
    if (!session.canBeControlledBy(input.ownerToken)) {
      throw new UnauthorizedError("Invalid owner token");
    }

    // セッション削除
    await this.sessionRepository.delete(session.id);
  }
}
