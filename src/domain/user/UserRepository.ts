import { User } from './User';
import { Email } from './Email';

/**
 * UserRepository インターフェース
 * ドメイン層で定義されるユーザーリポジトリの契約
 */
export interface UserRepository {
  /**
   * IDでユーザーを検索
   * @returns ユーザーが見つかった場合はUser、見つからない場合はnull
   */
  findById(id: string): Promise<User | null>;

  /**
   * メールアドレスでユーザーを検索
   * @returns ユーザーが見つかった場合はUser、見つからない場合はnull
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * ユーザーを永続化（作成または更新）
   * @returns 永続化されたUser
   */
  save(user: User): Promise<User>;

  /**
   * ユーザーを削除
   */
  delete(id: string): Promise<void>;

  /**
   * ゲストユーザーを作成
   * @returns 作成されたUser
   */
  createGuest(nickname: string): Promise<User>;

  /**
   * 認証ユーザーを作成（パスワードハッシュ付き）
   * @returns 作成されたUser
   */
  createAuthenticated(
    email: Email,
    nickname: string,
    passwordHash: string
  ): Promise<User>;
}
