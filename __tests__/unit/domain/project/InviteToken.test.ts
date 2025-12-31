import { describe, it, expect } from 'vitest';
import { InviteToken } from '@/domain/project/InviteToken';

describe('InviteToken', () => {
  describe('generate', () => {
    it('16文字のトークンを生成する', () => {
      const token = InviteToken.generate();
      expect(token.value).toHaveLength(16);
    });

    it('URL安全な文字列を生成する（base64url形式）', () => {
      const token = InviteToken.generate();
      const value = token.value;

      // base64url形式の文字のみを含む（A-Z, a-z, 0-9, -, _）
      expect(value).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('毎回異なるトークンを生成する', () => {
      const token1 = InviteToken.generate();
      const token2 = InviteToken.generate();
      const token3 = InviteToken.generate();

      expect(token1.value).not.toBe(token2.value);
      expect(token2.value).not.toBe(token3.value);
      expect(token1.value).not.toBe(token3.value);
    });
  });

  describe('fromString', () => {
    it('有効な16文字の文字列からトークンを作成する', () => {
      const validToken = 'abcdefghij123456';
      const token = InviteToken.fromString(validToken);
      expect(token.value).toBe(validToken);
    });

    it('16文字未満の文字列で例外を投げる', () => {
      const shortToken = 'abc123';
      expect(() => InviteToken.fromString(shortToken)).toThrow(
        'InviteToken must be 16 characters'
      );
    });

    it('16文字より長い文字列で例外を投げる', () => {
      const longToken = 'abcdefghij1234567890';
      expect(() => InviteToken.fromString(longToken)).toThrow(
        'InviteToken must be 16 characters'
      );
    });

    it('空文字列で例外を投げる', () => {
      expect(() => InviteToken.fromString('')).toThrow(
        'InviteToken must be 16 characters'
      );
    });
  });

  describe('equals', () => {
    it('同じ値のトークンは等しい', () => {
      const value = 'abcdefghij123456';
      const token1 = InviteToken.fromString(value);
      const token2 = InviteToken.fromString(value);

      expect(token1.equals(token2)).toBe(true);
    });

    it('異なる値のトークンは等しくない', () => {
      const token1 = InviteToken.fromString('abcdefghij123456');
      const token2 = InviteToken.fromString('xyz789uvw0123456');

      expect(token1.equals(token2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('トークンの値を文字列として返す', () => {
      const value = 'abcdefghij123456';
      const token = InviteToken.fromString(value);
      expect(token.toString()).toBe(value);
    });

    it('生成されたトークンの値を文字列として返す', () => {
      const token = InviteToken.generate();
      const value = token.toString();

      expect(typeof value).toBe('string');
      expect(value).toHaveLength(16);
    });
  });

  describe('value property', () => {
    it('valueプロパティから直接値にアクセスできる', () => {
      const value = 'abcdefghij123456';
      const token = InviteToken.fromString(value);
      expect(token.value).toBe(value);
    });
  });
});
