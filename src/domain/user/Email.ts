import { InvalidEmailError } from '../errors/DomainError';

/**
 * Email 値オブジェクト
 * メールアドレスのフォーマット検証を行う
 */
export class Email {
  private constructor(public readonly value: string) {}

  /**
   * メールアドレスからEmailオブジェクトを生成
   * @throws InvalidEmailError メールアドレスの形式が不正な場合
   */
  static create(email: string): Email {
    if (!this.isValid(email)) {
      throw new InvalidEmailError(email);
    }
    return new Email(email);
  }

  /**
   * メールアドレスの形式を検証
   */
  private static isValid(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * 他のEmailオブジェクトと等価性を比較
   */
  equals(other: Email): boolean {
    return this.value === other.value;
  }

  /**
   * 文字列表現を返す
   */
  toString(): string {
    return this.value;
  }
}
