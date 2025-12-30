import { describe, it, expect } from 'vitest';
import { generateShareToken, generateOwnerToken } from '@/lib/utils';

describe('Token Generation', () => {
  describe('generateShareToken', () => {
    it('should generate 16-character base64url token', () => {
      const token = generateShareToken();

      // Base64url形式（A-Z, a-z, 0-9, _, -）で16文字
      expect(token).toMatch(/^[A-Za-z0-9_-]{16}$/);
    });

    it('should generate unique tokens on successive calls', () => {
      const tokens = new Set<string>();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const token = generateShareToken();
        tokens.add(token);
      }

      // すべてのトークンがユニークであることを確認
      expect(tokens.size).toBe(iterations);
    });

    it('should not contain invalid characters', () => {
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const token = generateShareToken();

        // Base64urlに含まれない文字が含まれていないことを確認
        expect(token).not.toMatch(/[+\/=]/);
      }
    });
  });

  describe('generateOwnerToken', () => {
    it('should generate 32-character base64url token', () => {
      const token = generateOwnerToken();

      // Base64url形式（A-Z, a-z, 0-9, _, -）で32文字
      expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    });

    it('should generate unique tokens on successive calls', () => {
      const tokens = new Set<string>();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const token = generateOwnerToken();
        tokens.add(token);
      }

      // すべてのトークンがユニークであることを確認
      expect(tokens.size).toBe(iterations);
    });

    it('should not contain invalid characters', () => {
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const token = generateOwnerToken();

        // Base64urlに含まれない文字が含まれていないことを確認
        expect(token).not.toMatch(/[+\/=]/);
      }
    });

    it('should be different from shareToken', () => {
      const shareToken = generateShareToken();
      const ownerToken = generateOwnerToken();

      // shareTokenとownerTokenは異なることを確認
      expect(shareToken).not.toBe(ownerToken);

      // 長さも異なることを確認
      expect(shareToken.length).toBe(16);
      expect(ownerToken.length).toBe(32);
    });
  });
});
