import { UserRepository } from '@/domain/user/UserRepository';
import { User } from '@/domain/user/User';
import { Email } from '@/domain/user/Email';
import bcrypt from 'bcryptjs';

/**
 * RegisterUseCase
 * 新規ユーザー登録のユースケース
 */
export class RegisterUseCase {
  constructor(private userRepository: UserRepository) {}

  /**
   * 新規ユーザーを登録
   * @param email メールアドレス
   * @param password パスワード
   * @param nickname ニックネーム
   * @returns 作成されたUser
   * @throws Error バリデーションエラーまたはメールアドレス重複
   */
  async execute(
    email: string,
    password: string,
    nickname: string
  ): Promise<User> {
    // バリデーション
    if (!email || !password || !nickname) {
      throw new Error('Email, password, and nickname are required');
    }

    if (nickname.trim().length === 0) {
      throw new Error('Nickname cannot be empty');
    }

    if (nickname.trim().length > 50) {
      throw new Error('Nickname must be 50 characters or less');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // メールアドレス値オブジェクトを作成（バリデーション含む）
    const emailVO = Email.create(email);

    // メールアドレス重複チェック
    const existingUser = await this.userRepository.findByEmail(emailVO);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);

    // 認証ユーザー作成
    return await this.userRepository.createAuthenticated(
      emailVO,
      nickname.trim(),
      passwordHash
    );
  }
}
