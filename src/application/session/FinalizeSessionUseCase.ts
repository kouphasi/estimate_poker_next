import { SessionRepository } from "@/domain/session/SessionRepository";
import { ShareToken } from "@/domain/session/ShareToken";
import { NotFoundError, UnauthorizedError, ValidationError } from "@/domain/errors/DomainError";

export interface FinalizeSessionInput {
  shareToken: string;
  ownerToken: string;
  finalEstimate: number;
}

export interface FinalizeSessionOutput {
  id: string;
  shareToken: string;
  status: string;
  finalEstimate: number;
}

/**
 * セッション確定ユースケース
 *
 * ビジネスルール:
 * - セッションのオーナーのみが操作可能
 * - OwnerTokenで権限確認
 * - 確定後はステータスがFINALIZEDになる
 */
export class FinalizeSessionUseCase {
  constructor(private sessionRepository: SessionRepository) {}

  async execute(input: FinalizeSessionInput): Promise<FinalizeSessionOutput> {
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

    // すでに確定済みの場合はエラー
    if (session.isFinalized()) {
      throw new ValidationError("Session is already finalized");
    }

    // セッション確定
    const finalizedSession = session.finalize(input.finalEstimate);

    // 保存
    const saved = await this.sessionRepository.save(finalizedSession);

    return {
      id: saved.id,
      shareToken: saved.shareToken.value,
      status: saved.status,
      finalEstimate: saved.finalEstimate!,
    };
  }
}
