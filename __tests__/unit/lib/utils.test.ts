import { describe, it, expect } from 'vitest';
import { ShareToken } from '@/domain/session/ShareToken';
import { OwnerToken } from '@/domain/session/OwnerToken';

describe('Token Generation', () => {
  describe('ShareToken', () => {
    it('should generate 16-character base64url token', () => {
      const token = ShareToken.generate();

      // Base64url形式（A-Z, a-z, 0-9, _, -）で16文字
      expect(token.value).toMatch(/^[A-Za-z0-9_-]{16}$/);
    });

    it('should generate unique tokens on successive calls', () => {
      const tokens = new Set<string>();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const token = ShareToken.generate();
        tokens.add(token.value);
      }

      // すべてのトークンがユニークであることを確認
      expect(tokens.size).toBe(iterations);
    });

    it('should not contain invalid characters', () => {
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const token = ShareToken.generate();

        // Base64urlに含まれない文字が含まれていないことを確認
        expect(token.value).not.toMatch(/[+\/=]/);
      }
    });

    it('should create from valid string', () => {
      const token = ShareToken.fromString('ABCDabcd12340000');
      expect(token.value).toBe('ABCDabcd12340000');
    });

    it('should throw error for invalid length', () => {
      expect(() => ShareToken.fromString('short')).toThrow();
    });

    it('should compare equality correctly', () => {
      const token1 = ShareToken.fromString('ABCDabcd12340000');
      const token2 = ShareToken.fromString('ABCDabcd12340000');
      const token3 = ShareToken.fromString('XYZWxyzw56780000');

      expect(token1.equals(token2)).toBe(true);
      expect(token1.equals(token3)).toBe(false);
    });

    it('should return string representation via toString', () => {
      const token = ShareToken.fromString('ABCDabcd12340000');
      expect(token.toString()).toBe('ABCDabcd12340000');
    });
  });

  describe('OwnerToken', () => {
    it('should generate 32-character base64url token', () => {
      const token = OwnerToken.generate();

      // Base64url形式（A-Z, a-z, 0-9, _, -）で32文字
      expect(token.value).toMatch(/^[A-Za-z0-9_-]{32}$/);
    });

    it('should generate unique tokens on successive calls', () => {
      const tokens = new Set<string>();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const token = OwnerToken.generate();
        tokens.add(token.value);
      }

      // すべてのトークンがユニークであることを確認
      expect(tokens.size).toBe(iterations);
    });

    it('should not contain invalid characters', () => {
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const token = OwnerToken.generate();

        // Base64urlに含まれない文字が含まれていないことを確認
        expect(token.value).not.toMatch(/[+\/=]/);
      }
    });

    it('should create from valid string', () => {
      const token = OwnerToken.fromString('ABCDabcd1234567890123456789012ab');
      expect(token.value).toBe('ABCDabcd1234567890123456789012ab');
    });

    it('should throw error for invalid length', () => {
      expect(() => OwnerToken.fromString('short')).toThrow();
    });

    it('should compare equality correctly', () => {
      const token1 = OwnerToken.fromString('ABCDabcd1234567890123456789012ab');
      const token2 = OwnerToken.fromString('ABCDabcd1234567890123456789012ab');
      const token3 = OwnerToken.fromString('XYZWxyzw9876543210987654321098cd');

      expect(token1.equals(token2)).toBe(true);
      expect(token1.equals(token3)).toBe(false);
    });

    it('should return string representation via toString', () => {
      const token = OwnerToken.fromString('ABCDabcd1234567890123456789012ab');
      expect(token.toString()).toBe('ABCDabcd1234567890123456789012ab');
    });
  });

  describe('Token Differentiation', () => {
    it('should be different from shareToken', () => {
      const shareToken = ShareToken.generate();
      const ownerToken = OwnerToken.generate();

      // shareTokenとownerTokenは異なることを確認
      expect(shareToken.value).not.toBe(ownerToken.value);

      // 長さも異なることを確認
      expect(shareToken.value.length).toBe(16);
      expect(ownerToken.value.length).toBe(32);
    });
  });
});
