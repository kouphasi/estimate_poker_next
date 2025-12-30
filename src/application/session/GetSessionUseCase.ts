import { SessionRepository } from "@/domain/session/SessionRepository";
import { EstimateRepository } from "@/domain/session/EstimateRepository";
import { ShareToken } from "@/domain/session/ShareToken";
import { NotFoundError } from "@/domain/errors/DomainError";

export interface SessionWithEstimates {
  id: string;
  name: string | null;
  shareToken: string;
  ownerId: string | null;
  projectId: string | null;
  isRevealed: boolean;
  status: string;
  finalEstimate: number | null;
  createdAt: Date;
  estimates: Array<{
    id: string;
    nickname: string;
    value: number;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

/**
 * セッション取得ユースケース
 *
 * ビジネスルール:
 * - ShareTokenで公開セッション情報を取得
 * - 見積もりデータも含めて返す
 */
export class GetSessionUseCase {
  constructor(
    private sessionRepository: SessionRepository,
    private estimateRepository: EstimateRepository
  ) {}

  async execute(shareTokenString: string): Promise<SessionWithEstimates> {
    // ShareTokenでセッションを検索
    const shareToken = ShareToken.fromString(shareTokenString);
    const session = await this.sessionRepository.findByShareToken(shareToken);

    if (!session) {
      throw new NotFoundError(`Session not found with shareToken: ${shareTokenString}`);
    }

    // 関連する見積もりを取得
    const estimates = await this.estimateRepository.findBySessionId(session.id);

    return {
      id: session.id,
      name: session.name,
      shareToken: session.shareToken.value,
      ownerId: session.ownerId,
      projectId: session.projectId,
      isRevealed: session.isRevealed,
      status: session.status,
      finalEstimate: session.finalEstimate,
      createdAt: session.createdAt,
      estimates: estimates.map((est) => ({
        id: est.id,
        nickname: est.nickname,
        value: est.value,
        userId: est.userId,
        createdAt: est.createdAt,
        updatedAt: est.updatedAt,
      })),
    };
  }
}
