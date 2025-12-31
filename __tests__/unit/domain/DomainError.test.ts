import { describe, it, expect } from 'vitest';
import {
  DomainError,
  InvalidEmailError,
  InvalidTokenError,
  EntityNotFoundError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  BusinessRuleViolationError,
  InvalidEstimateValueError,
  SessionAlreadyFinalizedError,
} from '@/domain/errors/DomainError';

// DomainErrorは抽象クラスなので、テスト用に具象クラスを作成
class ConcreteDomainError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

describe('DomainError', () => {
  describe('DomainError (base class)', () => {
    it('should set error name to constructor name', () => {
      const error = new ConcreteDomainError('Test error');
      expect(error.name).toBe('ConcreteDomainError');
    });

    it('should set error message', () => {
      const error = new ConcreteDomainError('Test error message');
      expect(error.message).toBe('Test error message');
    });

    it('should be instance of Error', () => {
      const error = new ConcreteDomainError('Test error');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('InvalidEmailError', () => {
    it('should format message with email', () => {
      const error = new InvalidEmailError('invalid@');
      expect(error.message).toBe('Invalid email format: invalid@');
    });

    it('should set correct name', () => {
      const error = new InvalidEmailError('test');
      expect(error.name).toBe('InvalidEmailError');
    });
  });

  describe('InvalidTokenError', () => {
    it('should set message directly', () => {
      const error = new InvalidTokenError('Token is expired');
      expect(error.message).toBe('Token is expired');
    });

    it('should set correct name', () => {
      const error = new InvalidTokenError('test');
      expect(error.name).toBe('InvalidTokenError');
    });
  });

  describe('EntityNotFoundError', () => {
    it('should format message with entity name and identifier', () => {
      const error = new EntityNotFoundError('User', 'user-123');
      expect(error.message).toBe('User not found: user-123');
    });

    it('should set correct name', () => {
      const error = new EntityNotFoundError('Session', 'abc');
      expect(error.name).toBe('EntityNotFoundError');
    });
  });

  describe('NotFoundError', () => {
    it('should set message directly', () => {
      const error = new NotFoundError('Resource not found');
      expect(error.message).toBe('Resource not found');
    });

    it('should set correct name', () => {
      const error = new NotFoundError('test');
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('ValidationError', () => {
    it('should set message directly', () => {
      const error = new ValidationError('Invalid input');
      expect(error.message).toBe('Invalid input');
    });

    it('should set correct name', () => {
      const error = new ValidationError('test');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('UnauthorizedError', () => {
    it('should use default message when not provided', () => {
      const error = new UnauthorizedError();
      expect(error.message).toBe('Unauthorized operation');
    });

    it('should use custom message when provided', () => {
      const error = new UnauthorizedError('Access denied');
      expect(error.message).toBe('Access denied');
    });

    it('should set correct name', () => {
      const error = new UnauthorizedError();
      expect(error.name).toBe('UnauthorizedError');
    });
  });

  describe('BusinessRuleViolationError', () => {
    it('should set message directly', () => {
      const error = new BusinessRuleViolationError('Business rule violated');
      expect(error.message).toBe('Business rule violated');
    });

    it('should set correct name', () => {
      const error = new BusinessRuleViolationError('test');
      expect(error.name).toBe('BusinessRuleViolationError');
    });
  });

  describe('InvalidEstimateValueError', () => {
    it('should format message with value', () => {
      const error = new InvalidEstimateValueError(-5);
      expect(error.message).toBe('Invalid estimate value: -5. Value must be a positive number.');
    });

    it('should set correct name', () => {
      const error = new InvalidEstimateValueError(0);
      expect(error.name).toBe('InvalidEstimateValueError');
    });
  });

  describe('SessionAlreadyFinalizedError', () => {
    it('should format message with session id', () => {
      const error = new SessionAlreadyFinalizedError('session-123');
      expect(error.message).toBe('Session is already finalized: session-123');
    });

    it('should set correct name', () => {
      const error = new SessionAlreadyFinalizedError('test');
      expect(error.name).toBe('SessionAlreadyFinalizedError');
    });
  });
});
