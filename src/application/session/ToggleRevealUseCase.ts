import { SessionRepository } from "@/domain/session/SessionRepository";
import { ShareToken } from "@/domain/session/ShareToken";
import { NotFoundError, UnauthorizedError } from "@/domain/errors/DomainError";

export interface ToggleRevealInput {
  shareToken: string;
  ownerToken: string;
  reveal?: boolean; // true: reveal, false: hide, undefined: toggle
}

export interface ToggleRevealOutput {
  id: string;
  shareToken: string;
  isRevealed: boolean;
}

/**
 * 見積もり表示/非表示切り替えユースケース
 *
 * ビジネスルール:
 * - セッションのオーナーのみが操作可能
 * - OwnerTokenで権限確認
 */
export class ToggleRevealUseCase {
  constructor(private sessionRepository: SessionRepository) {}

  async execute(input: ToggleRevealInput): Promise<ToggleRevealOutput> {
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

    // reveal/hide操作
    let updatedSession;
    if (input.reveal === true) {
      updatedSession = session.reveal();
    } else if (input.reveal === false) {
      updatedSession = session.hide();
    } else {
      // toggle
      updatedSession = session.isRevealed ? session.hide() : session.reveal();
    }

    // 保存
    const saved = await this.sessionRepository.save(updatedSession);

    return {
      id: saved.id,
      shareToken: saved.shareToken.value,
      isRevealed: saved.isRevealed,
    };
  }
}
