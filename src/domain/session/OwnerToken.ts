import { randomBytes } from 'crypto';
import { InvalidTokenError } from '../errors/DomainError';

/**
 * OwnerToken 値オブジェクト
 * セッションオーナー認証用トークンの生成と検証を行う（32文字のbase64url）
 */
export class OwnerToken {
  private static readonly TOKEN_LENGTH = 32;

  private constructor(public readonly value: string) {}

  /**
   * 新しいOwnerTokenを生成
   */
  static generate(): OwnerToken {
    const token = randomBytes(24).toString('base64url');
    return new OwnerToken(token);
  }

  /**
   * 文字列からOwnerTokenオブジェクトを生成
   * @throws InvalidTokenError トークンの長さが32文字でない場合
   */
  static fromString(value: string): OwnerToken {
    if (value.length !== this.TOKEN_LENGTH) {
      throw new InvalidTokenError(`OwnerToken must be ${this.TOKEN_LENGTH} characters`);
    }
    return new OwnerToken(value);
  }

  /**
   * 他のOwnerTokenオブジェクトと等価性を比較
   */
  equals(other: OwnerToken): boolean {
    return this.value === other.value;
  }

  /**
   * 文字列表現を返す
   */
  toString(): string {
    return this.value;
  }
}
