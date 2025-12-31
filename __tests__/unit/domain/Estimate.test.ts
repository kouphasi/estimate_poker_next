import { describe, it, expect } from 'vitest';
import { Estimate } from '@/domain/session/Estimate';
import { InvalidEstimateValueError } from '@/domain/errors/DomainError';

describe('Estimate Entity', () => {
  const now = new Date();

  describe('constructor', () => {
    it('should create estimate with all properties', () => {
      const estimate = new Estimate(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        5,
        now,
        now
      );

      expect(estimate.id).toBe('estimate-123');
      expect(estimate.sessionId).toBe('session-123');
      expect(estimate.userId).toBe('user-123');
      expect(estimate.nickname).toBe('Test User');
      expect(estimate.value).toBe(5);
      expect(estimate.createdAt).toBe(now);
      expect(estimate.updatedAt).toBe(now);
    });

    it('should accept zero value', () => {
      const estimate = new Estimate(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        0,
        now,
        now
      );

      expect(estimate.value).toBe(0);
    });

    it('should accept decimal values', () => {
      const estimate = new Estimate(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        2.5,
        now,
        now
      );

      expect(estimate.value).toBe(2.5);
    });

    it('should throw InvalidEstimateValueError for negative values', () => {
      expect(() => new Estimate(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        -1,
        now,
        now
      )).toThrow(InvalidEstimateValueError);
    });
  });

  describe('update', () => {
    it('should return new estimate with updated value', () => {
      const original = Estimate.create(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        5
      );

      const updated = original.update(10);

      expect(updated.value).toBe(10);
    });

    it('should preserve other properties', () => {
      const original = Estimate.create(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        5
      );

      const updated = original.update(10);

      expect(updated.id).toBe(original.id);
      expect(updated.sessionId).toBe(original.sessionId);
      expect(updated.userId).toBe(original.userId);
      expect(updated.nickname).toBe(original.nickname);
      expect(updated.createdAt).toBe(original.createdAt);
    });

    it('should update updatedAt timestamp', () => {
      const original = new Estimate(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        5,
        new Date('2020-01-01'),
        new Date('2020-01-01')
      );

      const updated = original.update(10);

      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        original.updatedAt.getTime()
      );
    });

    it('should not modify original estimate', () => {
      const original = Estimate.create(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        5
      );

      original.update(10);

      expect(original.value).toBe(5);
    });

    it('should throw InvalidEstimateValueError for negative values', () => {
      const original = Estimate.create(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        5
      );

      expect(() => original.update(-1)).toThrow(InvalidEstimateValueError);
    });
  });

  describe('updateNickname', () => {
    it('should return new estimate with updated nickname', () => {
      const original = Estimate.create(
        'estimate-123',
        'session-123',
        'user-123',
        'Original Name',
        5
      );

      const updated = original.updateNickname('New Name');

      expect(updated.nickname).toBe('New Name');
    });

    it('should preserve other properties', () => {
      const original = Estimate.create(
        'estimate-123',
        'session-123',
        'user-123',
        'Original Name',
        5
      );

      const updated = original.updateNickname('New Name');

      expect(updated.id).toBe(original.id);
      expect(updated.sessionId).toBe(original.sessionId);
      expect(updated.userId).toBe(original.userId);
      expect(updated.value).toBe(original.value);
      expect(updated.createdAt).toBe(original.createdAt);
    });

    it('should update updatedAt timestamp', () => {
      const original = new Estimate(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        5,
        new Date('2020-01-01'),
        new Date('2020-01-01')
      );

      const updated = original.updateNickname('New Name');

      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        original.updatedAt.getTime()
      );
    });

    it('should not modify original estimate', () => {
      const original = Estimate.create(
        'estimate-123',
        'session-123',
        'user-123',
        'Original Name',
        5
      );

      original.updateNickname('New Name');

      expect(original.nickname).toBe('Original Name');
    });
  });

  describe('belongsToSession', () => {
    it('should return true for matching session id', () => {
      const estimate = Estimate.create(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        5
      );

      expect(estimate.belongsToSession('session-123')).toBe(true);
    });

    it('should return false for non-matching session id', () => {
      const estimate = Estimate.create(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        5
      );

      expect(estimate.belongsToSession('other-session')).toBe(false);
    });
  });

  describe('belongsToUser', () => {
    it('should return true for matching user id', () => {
      const estimate = Estimate.create(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        5
      );

      expect(estimate.belongsToUser('user-123')).toBe(true);
    });

    it('should return false for non-matching user id', () => {
      const estimate = Estimate.create(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        5
      );

      expect(estimate.belongsToUser('other-user')).toBe(false);
    });
  });

  describe('create', () => {
    it('should create estimate with correct properties', () => {
      const estimate = Estimate.create(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        5
      );

      expect(estimate.id).toBe('estimate-123');
      expect(estimate.sessionId).toBe('session-123');
      expect(estimate.userId).toBe('user-123');
      expect(estimate.nickname).toBe('Test User');
      expect(estimate.value).toBe(5);
    });

    it('should set createdAt and updatedAt to same value', () => {
      const estimate = Estimate.create(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        5
      );

      expect(estimate.createdAt.getTime()).toBe(estimate.updatedAt.getTime());
    });

    it('should accept zero value', () => {
      const estimate = Estimate.create(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        0
      );

      expect(estimate.value).toBe(0);
    });

    it('should throw InvalidEstimateValueError for negative values', () => {
      expect(() => Estimate.create(
        'estimate-123',
        'session-123',
        'user-123',
        'Test User',
        -5
      )).toThrow(InvalidEstimateValueError);
    });
  });
});
