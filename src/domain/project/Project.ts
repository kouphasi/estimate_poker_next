/**
 * Project エンティティ
 * 見積もりセッションをグループ化する単位
 * 認証ユーザーのみが作成・管理可能
 */
export class Project {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly ownerId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * 指定されたユーザーがこのプロジェクトのオーナーかどうかを判定
   */
  isOwnedBy(userId: string): boolean {
    return this.ownerId === userId;
  }

  /**
   * 指定されたユーザーがこのプロジェクトを削除可能かどうかを判定
   * オーナーのみが削除可能
   */
  canBeDeletedBy(userId: string): boolean {
    return this.isOwnedBy(userId);
  }

  /**
   * 指定されたユーザーがこのプロジェクトを更新可能かどうかを判定
   * オーナーのみが更新可能
   */
  canBeUpdatedBy(userId: string): boolean {
    return this.isOwnedBy(userId);
  }

  /**
   * プロジェクト情報を更新した新しいインスタンスを返す
   */
  update(params: { name?: string; description?: string | null }): Project {
    return new Project(
      this.id,
      params.name ?? this.name,
      params.description !== undefined ? params.description : this.description,
      this.ownerId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * 静的ファクトリメソッド: 新規プロジェクトを作成
   */
  static create(
    id: string,
    name: string,
    description: string | null,
    ownerId: string
  ): Project {
    const now = new Date();
    return new Project(id, name, description, ownerId, now, now);
  }
}
