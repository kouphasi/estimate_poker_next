import { randomBytes } from 'crypto';
import { InvalidTokenError } from '../errors/DomainError';

/**
 * InviteToken 値オブジェクト
 * プロジェクト招待用トークンの生成と検証を行う（16文字のbase64url）
 */
export class InviteToken {
  private static readonly TOKEN_LENGTH = 16;

  private constructor(public readonly value: string) {}

  /**
   * 新しいInviteTokenを生成
   */
  static generate(): InviteToken {
    const token = randomBytes(12).toString('base64url').substring(0, this.TOKEN_LENGTH);
    return new InviteToken(token);
  }

  /**
   * 文字列からInviteTokenオブジェクトを生成
   * @throws InvalidTokenError トークンの長さが16文字でない場合
   */
  static fromString(value: string): InviteToken {
    if (value.length !== this.TOKEN_LENGTH) {
      throw new InvalidTokenError(`InviteToken must be ${this.TOKEN_LENGTH} characters`);
    }
    return new InviteToken(value);
  }

  /**
   * 他のInviteTokenオブジェクトと等価性を比較
   */
  equals(other: InviteToken): boolean {
    return this.value === other.value;
  }

  /**
   * 文字列表現を返す
   */
  toString(): string {
    return this.value;
  }
}
