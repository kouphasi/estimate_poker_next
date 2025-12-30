import { UserRepository } from '@/domain/user/UserRepository';
import { User } from '@/domain/user/User';

/**
 * CreateGuestUserUseCase
 * ゲストユーザー作成のユースケース
 */
export class CreateGuestUserUseCase {
  constructor(private userRepository: UserRepository) {}

  /**
   * ゲストユーザーを作成
   * @param nickname ニックネーム
   * @returns 作成されたUser
   * @throws Error ニックネームが不正な場合
   */
  async execute(nickname: string): Promise<User> {
    // バリデーション
    if (!nickname || nickname.trim().length === 0) {
      throw new Error('Nickname is required');
    }

    if (nickname.trim().length > 50) {
      throw new Error('Nickname must be 50 characters or less');
    }

    // ゲストユーザー作成
    return await this.userRepository.createGuest(nickname.trim());
  }
}
