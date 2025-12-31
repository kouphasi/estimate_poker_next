import { describe, it, expect, beforeEach } from 'vitest';
import { User } from '@/domain/user/User';
import { Email } from '@/domain/user/Email';

describe('User Entity', () => {
  const testEmail = Email.create('test@example.com');
  const now = new Date();

  describe('constructor', () => {
    it('should create user with all properties', () => {
      const user = new User(
        'user-123',
        testEmail,
        'Test User',
        false,
        now,
        now,
        'hashedPassword'
      );

      expect(user.id).toBe('user-123');
      expect(user.email).toBe(testEmail);
      expect(user.nickname).toBe('Test User');
      expect(user.isGuest).toBe(false);
      expect(user.createdAt).toBe(now);
      expect(user.updatedAt).toBe(now);
      expect(user.passwordHash).toBe('hashedPassword');
    });

    it('should allow null email for guest users', () => {
      const user = new User(
        'user-123',
        null,
        'Guest User',
        true,
        now,
        now,
        null
      );

      expect(user.email).toBeNull();
    });
  });

  describe('canManageProjects', () => {
    it('should return false for guest users', () => {
      const guestUser = User.createGuest('guest-123', 'Guest');
      expect(guestUser.canManageProjects()).toBe(false);
    });

    it('should return true for authenticated users', () => {
      const authUser = User.createAuthenticated(
        'user-123',
        testEmail,
        'Auth User',
        'hashedPassword'
      );
      expect(authUser.canManageProjects()).toBe(true);
    });
  });

  describe('canCreateSession', () => {
    it('should return true for guest users', () => {
      const guestUser = User.createGuest('guest-123', 'Guest');
      expect(guestUser.canCreateSession()).toBe(true);
    });

    it('should return true for authenticated users', () => {
      const authUser = User.createAuthenticated(
        'user-123',
        testEmail,
        'Auth User',
        'hashedPassword'
      );
      expect(authUser.canCreateSession()).toBe(true);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false for guest users', () => {
      const guestUser = User.createGuest('guest-123', 'Guest');
      expect(guestUser.isAuthenticated()).toBe(false);
    });

    it('should return true for authenticated users', () => {
      const authUser = User.createAuthenticated(
        'user-123',
        testEmail,
        'Auth User',
        'hashedPassword'
      );
      expect(authUser.isAuthenticated()).toBe(true);
    });
  });

  describe('updateNickname', () => {
    it('should return new User with updated nickname', () => {
      const originalUser = User.createGuest('user-123', 'Original Name');
      const updatedUser = originalUser.updateNickname('New Name');

      expect(updatedUser.nickname).toBe('New Name');
      expect(updatedUser.id).toBe(originalUser.id);
      expect(updatedUser.isGuest).toBe(originalUser.isGuest);
    });

    it('should not modify original user', () => {
      const originalUser = User.createGuest('user-123', 'Original Name');
      originalUser.updateNickname('New Name');

      expect(originalUser.nickname).toBe('Original Name');
    });

    it('should update updatedAt timestamp', () => {
      const originalUser = new User(
        'user-123',
        null,
        'Test',
        true,
        new Date('2020-01-01'),
        new Date('2020-01-01'),
        null
      );
      const updatedUser = originalUser.updateNickname('New Name');

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
        originalUser.updatedAt.getTime()
      );
    });
  });

  describe('createGuest', () => {
    it('should create guest user with correct properties', () => {
      const user = User.createGuest('guest-123', 'Guest User');

      expect(user.id).toBe('guest-123');
      expect(user.email).toBeNull();
      expect(user.nickname).toBe('Guest User');
      expect(user.isGuest).toBe(true);
      expect(user.passwordHash).toBeNull();
    });

    it('should set createdAt and updatedAt to same value', () => {
      const user = User.createGuest('guest-123', 'Guest User');
      expect(user.createdAt.getTime()).toBe(user.updatedAt.getTime());
    });
  });

  describe('createAuthenticated', () => {
    it('should create authenticated user with correct properties', () => {
      const user = User.createAuthenticated(
        'user-123',
        testEmail,
        'Auth User',
        'hashedPassword123'
      );

      expect(user.id).toBe('user-123');
      expect(user.email?.value).toBe('test@example.com');
      expect(user.nickname).toBe('Auth User');
      expect(user.isGuest).toBe(false);
      expect(user.passwordHash).toBe('hashedPassword123');
    });

    it('should set createdAt and updatedAt to same value', () => {
      const user = User.createAuthenticated(
        'user-123',
        testEmail,
        'Auth User',
        'hashedPassword'
      );
      expect(user.createdAt.getTime()).toBe(user.updatedAt.getTime());
    });
  });
});
