import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isProtectedPath,
  checkAuthentication,
  logAuthDebug,
  AuthCheckResult,
} from '@/application/middleware/authMiddleware';
import { JWT } from 'next-auth/jwt';

describe('authMiddleware', () => {
  describe('isProtectedPath', () => {
    it('should return true for /mypage', () => {
      expect(isProtectedPath('/mypage')).toBe(true);
    });

    it('should return true for /mypage/settings', () => {
      expect(isProtectedPath('/mypage/settings')).toBe(true);
    });

    it('should return true for /projects', () => {
      expect(isProtectedPath('/projects')).toBe(true);
    });

    it('should return true for /projects/123', () => {
      expect(isProtectedPath('/projects/123')).toBe(true);
    });

    it('should return false for root path', () => {
      expect(isProtectedPath('/')).toBe(false);
    });

    it('should return false for /login', () => {
      expect(isProtectedPath('/login')).toBe(false);
    });

    it('should return false for /register', () => {
      expect(isProtectedPath('/register')).toBe(false);
    });

    it('should return false for /estimate', () => {
      expect(isProtectedPath('/estimate/abc123')).toBe(false);
    });
  });

  describe('checkAuthentication', () => {
    it('should be authenticated with NextAuth token', () => {
      const token = { sub: 'user-123', name: 'Test User' } as JWT;
      const result = checkAuthentication(token, undefined, undefined, '/mypage');

      expect(result.isAuthenticated).toBe(true);
      expect(result.hasNextAuthToken).toBe(true);
      expect(result.hasSimpleLoginCookie).toBe(false);
      expect(result.hasNextAuthCookie).toBe(false);
    });

    it('should be authenticated with simple login cookie', () => {
      const result = checkAuthentication(
        null,
        'user-data-cookie',
        undefined,
        '/mypage'
      );

      expect(result.isAuthenticated).toBe(true);
      expect(result.hasNextAuthToken).toBe(false);
      expect(result.hasSimpleLoginCookie).toBe(true);
      expect(result.hasNextAuthCookie).toBe(false);
    });

    it('should be authenticated with NextAuth cookie fallback', () => {
      const result = checkAuthentication(
        null,
        undefined,
        'session-cookie',
        '/mypage'
      );

      expect(result.isAuthenticated).toBe(true);
      expect(result.hasNextAuthToken).toBe(false);
      expect(result.hasSimpleLoginCookie).toBe(false);
      expect(result.hasNextAuthCookie).toBe(true);
    });

    it('should not be authenticated with no credentials', () => {
      const result = checkAuthentication(null, undefined, undefined, '/mypage');

      expect(result.isAuthenticated).toBe(false);
      expect(result.hasNextAuthToken).toBe(false);
      expect(result.hasSimpleLoginCookie).toBe(false);
      expect(result.hasNextAuthCookie).toBe(false);
    });

    it('should detect nickname setup needed when nickname equals email', () => {
      const token = {
        sub: 'user-123',
        nickname: 'test@example.com',
        email: 'test@example.com',
      } as JWT;
      const result = checkAuthentication(token, undefined, undefined, '/mypage');

      expect(result.needsNicknameSetup).toBe(true);
    });

    it('should not need nickname setup when nickname differs from email', () => {
      const token = {
        sub: 'user-123',
        nickname: 'My Nickname',
        email: 'test@example.com',
      } as JWT;
      const result = checkAuthentication(token, undefined, undefined, '/mypage');

      expect(result.needsNicknameSetup).toBe(false);
    });

    it('should not need nickname setup on setup-nickname page', () => {
      const token = {
        sub: 'user-123',
        nickname: 'test@example.com',
        email: 'test@example.com',
      } as JWT;
      const result = checkAuthentication(
        token,
        undefined,
        undefined,
        '/setup-nickname'
      );

      expect(result.needsNicknameSetup).toBe(false);
    });

    it('should not need nickname setup without token', () => {
      const result = checkAuthentication(null, 'cookie', undefined, '/mypage');

      expect(result.needsNicknameSetup).toBe(false);
    });

    it('should return the token in result', () => {
      const token = { sub: 'user-123', name: 'Test' } as JWT;
      const result = checkAuthentication(token, undefined, undefined, '/mypage');

      expect(result.token).toBe(token);
    });

    it('should return null token when no token provided', () => {
      const result = checkAuthentication(
        null,
        'cookie',
        undefined,
        '/mypage'
      );

      expect(result.token).toBeNull();
    });
  });

  describe('logAuthDebug', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log basic auth information', () => {
      const result: AuthCheckResult = {
        isAuthenticated: true,
        needsNicknameSetup: false,
        hasNextAuthToken: true,
        hasSimpleLoginCookie: false,
        hasNextAuthCookie: false,
        token: { sub: 'user-123' } as JWT,
      };

      logAuthDebug('/mypage', [{ name: 'session', value: 'abc' }], result);

      expect(consoleSpy).toHaveBeenCalledWith('[Middleware] Path:', '/mypage');
      expect(consoleSpy).toHaveBeenCalledWith('[Middleware] All cookies:', [
        'session',
      ]);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Middleware] Has token from getToken:',
        true
      );
    });

    it('should log warning when NextAuth cookie exists but token failed', () => {
      const result: AuthCheckResult = {
        isAuthenticated: true,
        needsNicknameSetup: false,
        hasNextAuthToken: false,
        hasSimpleLoginCookie: false,
        hasNextAuthCookie: true,
        token: null,
      };

      logAuthDebug('/mypage', [], result);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Middleware] Warning: Next-Auth cookie exists but getToken failed. Allowing access anyway.'
      );
    });

    it('should log when not authenticated', () => {
      const result: AuthCheckResult = {
        isAuthenticated: false,
        needsNicknameSetup: false,
        hasNextAuthToken: false,
        hasSimpleLoginCookie: false,
        hasNextAuthCookie: false,
        token: null,
      };

      logAuthDebug('/mypage', [], result);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Middleware] No authentication found'
      );
    });

    it('should log when nickname setup is needed', () => {
      const result: AuthCheckResult = {
        isAuthenticated: true,
        needsNicknameSetup: true,
        hasNextAuthToken: true,
        hasSimpleLoginCookie: false,
        hasNextAuthCookie: false,
        token: { sub: 'user-123', nickname: 'test@example.com', email: 'test@example.com' } as JWT,
      };

      logAuthDebug('/mypage', [], result);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Middleware] User needs to set up nickname'
      );
    });
  });
});
