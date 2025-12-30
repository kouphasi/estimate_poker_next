import { Email } from './Email';

/**
 * User エンティティ
 * ユーザーのアイデンティティと基本情報を表現
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: Email | null,
    public readonly nickname: string,
    public readonly isGuest: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly passwordHash?: string | null
  ) {}

  /**
   * プロジェクト管理が可能かどうかを判定
   * ゲストユーザーはプロジェクトを管理できない
   */
  canManageProjects(): boolean {
    return !this.isGuest;
  }

  /**
   * セッション作成が可能かどうかを判定
   * すべてのユーザー（ゲスト含む）がセッションを作成可能
   */
  canCreateSession(): boolean {
    return true;
  }

  /**
   * 認証済みユーザーかどうかを判定
   */
  isAuthenticated(): boolean {
    return !this.isGuest;
  }

  /**
   * 新しいニックネームでUserを更新したインスタンスを返す
   */
  updateNickname(newNickname: string): User {
    return new User(
      this.id,
      this.email,
      newNickname,
      this.isGuest,
      this.createdAt,
      new Date(),
      this.passwordHash
    );
  }

  /**
   * 静的ファクトリメソッド: ゲストユーザーを作成
   */
  static createGuest(id: string, nickname: string): User {
    const now = new Date();
    return new User(id, null, nickname, true, now, now, null);
  }

  /**
   * 静的ファクトリメソッド: 認証ユーザーを作成
   */
  static createAuthenticated(
    id: string,
    email: Email,
    nickname: string,
    passwordHash: string
  ): User {
    const now = new Date();
    return new User(id, email, nickname, false, now, now, passwordHash);
  }
}
