import { randomBytes } from 'crypto';
import { InvalidTokenError } from '../errors/DomainError';

/**
 * ShareToken 値オブジェクト
 * セッション共有用トークンの生成と検証を行う（16文字のbase64url）
 */
export class ShareToken {
  private static readonly TOKEN_LENGTH = 16;

  private constructor(public readonly value: string) {}

  /**
   * 新しいShareTokenを生成
   */
  static generate(): ShareToken {
    const token = randomBytes(12).toString('base64url').substring(0, this.TOKEN_LENGTH);
    return new ShareToken(token);
  }

  /**
   * 文字列からShareTokenオブジェクトを生成
   * @throws InvalidTokenError トークンの長さが16文字でない場合
   */
  static fromString(value: string): ShareToken {
    if (value.length !== this.TOKEN_LENGTH) {
      throw new InvalidTokenError(`ShareToken must be ${this.TOKEN_LENGTH} characters`);
    }
    return new ShareToken(value);
  }

  /**
   * 他のShareTokenオブジェクトと等価性を比較
   */
  equals(other: ShareToken): boolean {
    return this.value === other.value;
  }

  /**
   * 文字列表現を返す
   */
  toString(): string {
    return this.value;
  }
}
