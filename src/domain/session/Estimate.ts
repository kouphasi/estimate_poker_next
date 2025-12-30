import { InvalidEstimateValueError } from '../errors/DomainError';

/**
 * Estimate エンティティ
 * 特定のセッションにおける特定のユーザーの見積もり値を表現
 */
export class Estimate {
  constructor(
    public readonly id: string,
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly nickname: string,
    public readonly value: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validateValue(value);
  }

  /**
   * 見積もり値を検証
   * @throws InvalidEstimateValueError 見積もり値が不正な場合
   */
  private validateValue(value: number): void {
    if (value < 0) {
      throw new InvalidEstimateValueError(value);
    }
  }

  /**
   * 見積もり値を更新した新しいインスタンスを返す
   * @throws InvalidEstimateValueError 新しい値が不正な場合
   */
  update(newValue: number): Estimate {
    return new Estimate(
      this.id,
      this.sessionId,
      this.userId,
      this.nickname,
      newValue,
      this.createdAt,
      new Date()
    );
  }

  /**
   * ニックネームを更新した新しいインスタンスを返す
   */
  updateNickname(newNickname: string): Estimate {
    return new Estimate(
      this.id,
      this.sessionId,
      this.userId,
      newNickname,
      this.value,
      this.createdAt,
      new Date()
    );
  }

  /**
   * 指定されたセッションに属するかどうかを判定
   */
  belongsToSession(sessionId: string): boolean {
    return this.sessionId === sessionId;
  }

  /**
   * 指定されたユーザーの見積もりかどうかを判定
   */
  belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * 静的ファクトリメソッド: 新規見積もりを作成
   */
  static create(
    id: string,
    sessionId: string,
    userId: string,
    nickname: string,
    value: number
  ): Estimate {
    const now = new Date();
    return new Estimate(id, sessionId, userId, nickname, value, now, now);
  }
}
