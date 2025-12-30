import { ShareToken } from './ShareToken';
import { OwnerToken } from './OwnerToken';
import { SessionStatus } from './SessionStatus';
import {
  SessionAlreadyFinalizedError,
  UnauthorizedError,
  InvalidEstimateValueError,
} from '../errors/DomainError';

/**
 * EstimationSession エンティティ
 * 見積もりセッションの状態とメタデータを管理
 */
export class EstimationSession {
  constructor(
    public readonly id: string,
    public readonly name: string | null,
    public readonly shareToken: ShareToken,
    public readonly ownerToken: OwnerToken,
    public readonly ownerId: string | null,
    public readonly projectId: string | null,
    public readonly isRevealed: boolean,
    public readonly status: SessionStatus,
    public readonly finalEstimate: number | null,
    public readonly createdAt: Date
  ) {}

  /**
   * カードを公開状態にする
   */
  reveal(): EstimationSession {
    return new EstimationSession(
      this.id,
      this.name,
      this.shareToken,
      this.ownerToken,
      this.ownerId,
      this.projectId,
      true,
      this.status,
      this.finalEstimate,
      this.createdAt
    );
  }

  /**
   * カードを非公開状態にする
   */
  hide(): EstimationSession {
    return new EstimationSession(
      this.id,
      this.name,
      this.shareToken,
      this.ownerToken,
      this.ownerId,
      this.projectId,
      false,
      this.status,
      this.finalEstimate,
      this.createdAt
    );
  }

  /**
   * セッションを確定する
   * @throws SessionAlreadyFinalizedError 既に確定済みの場合
   * @throws InvalidEstimateValueError 見積もり値が不正な場合
   */
  finalize(estimate: number): EstimationSession {
    if (this.isFinalized()) {
      throw new SessionAlreadyFinalizedError(this.id);
    }

    if (estimate <= 0 || estimate > 300) {
      throw new InvalidEstimateValueError(estimate);
    }

    return new EstimationSession(
      this.id,
      this.name,
      this.shareToken,
      this.ownerToken,
      this.ownerId,
      this.projectId,
      true, // 確定時は必ず公開
      SessionStatus.FINALIZED,
      estimate,
      this.createdAt
    );
  }

  /**
   * 指定されたトークンでセッションを制御可能かどうかを判定
   */
  canBeControlledBy(ownerToken: string): boolean {
    return this.ownerToken.value === ownerToken;
  }

  /**
   * セッションがアクティブかどうかを判定
   */
  isActive(): boolean {
    return this.status === SessionStatus.ACTIVE;
  }

  /**
   * セッションが確定済みかどうかを判定
   */
  isFinalized(): boolean {
    return this.status === SessionStatus.FINALIZED;
  }

  /**
   * オーナー権限を検証する
   * @throws UnauthorizedError 権限がない場合
   */
  verifyOwnership(ownerToken: string): void {
    if (!this.canBeControlledBy(ownerToken)) {
      throw new UnauthorizedError('You do not have permission to control this session');
    }
  }

  /**
   * 静的ファクトリメソッド: 新規セッションを作成
   */
  static create(
    id: string,
    name: string | null,
    shareToken: ShareToken,
    ownerToken: OwnerToken,
    ownerId: string | null,
    projectId: string | null
  ): EstimationSession {
    return new EstimationSession(
      id,
      name,
      shareToken,
      ownerToken,
      ownerId,
      projectId,
      false,
      SessionStatus.ACTIVE,
      null,
      new Date()
    );
  }
}
