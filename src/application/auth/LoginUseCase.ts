import { UserRepository } from '@/domain/user/UserRepository';
import { User } from '@/domain/user/User';
import { Email } from '@/domain/user/Email';
import bcrypt from 'bcryptjs';

/**
 * LoginResult
 * ログイン結果
 */
export interface LoginResult {
  user: User;
  isValid: boolean;
}

/**
 * LoginUseCase
 * ログイン認証のユースケース
 */
export class LoginUseCase {
  constructor(private userRepository: UserRepository) {}

  /**
   * ログイン認証を実行
   * @param email メールアドレス
   * @param password パスワード
   * @returns ログイン結果
   * @throws Error バリデーションエラーまたは認証失敗
   */
  async execute(email: string, password: string): Promise<LoginResult> {
    // バリデーション
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // メールアドレス値オブジェクトを作成
    const emailVO = Email.create(email);

    // ユーザー検索
    const user = await this.userRepository.findByEmail(emailVO);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // パスワードハッシュが存在しない場合（Google OAuth等で作成されたユーザー）
    if (!user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    // パスワード検証
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    return {
      user,
      isValid: true,
    };
  }

  /**
   * パスワード検証のみを実行（NextAuth用）
   * @param email メールアドレス
   * @param password パスワード
   * @returns 検証が成功した場合はUser、失敗した場合はnull
   */
  async verifyCredentials(
    email: string,
    password: string
  ): Promise<User | null> {
    try {
      const result = await this.execute(email, password);
      return result.isValid ? result.user : null;
    } catch {
      return null;
    }
  }
}
