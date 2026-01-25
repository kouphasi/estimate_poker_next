import { describe, it, expect } from 'vitest';
import {
  isPrismaError,
  isUniqueConstraintViolation,
  isForeignKeyConstraintViolation,
  isRecordNotFoundError,
} from '@/infrastructure/database/prismaErrors';

const createPrismaError = (code: string) =>
  Object.assign(new Error('Prisma error'), { code });

describe('prismaErrors', () => {
  describe('isPrismaError', () => {
    it('should return true for Error with code', () => {
      const error = createPrismaError('P2002');

      expect(isPrismaError(error)).toBe(true);
    });

    it('should return false for non-Error values', () => {
      expect(isPrismaError({ code: 'P2002' })).toBe(false);
      expect(isPrismaError('P2002')).toBe(false);
    });

    it('should return false for Error without code', () => {
      expect(isPrismaError(new Error('oops'))).toBe(false);
    });
  });

  describe('specific Prisma error helpers', () => {
    it('should detect unique constraint violations', () => {
      const error = createPrismaError('P2002');

      expect(isUniqueConstraintViolation(error)).toBe(true);
      expect(isForeignKeyConstraintViolation(error)).toBe(false);
      expect(isRecordNotFoundError(error)).toBe(false);
    });

    it('should detect foreign key constraint violations', () => {
      const error = createPrismaError('P2003');

      expect(isForeignKeyConstraintViolation(error)).toBe(true);
      expect(isUniqueConstraintViolation(error)).toBe(false);
      expect(isRecordNotFoundError(error)).toBe(false);
    });

    it('should detect record not found errors', () => {
      const error = createPrismaError('P2025');

      expect(isRecordNotFoundError(error)).toBe(true);
      expect(isUniqueConstraintViolation(error)).toBe(false);
      expect(isForeignKeyConstraintViolation(error)).toBe(false);
    });

    it('should return false for non-Prisma errors', () => {
      const error = new Error('not prisma');

      expect(isUniqueConstraintViolation(error)).toBe(false);
      expect(isForeignKeyConstraintViolation(error)).toBe(false);
      expect(isRecordNotFoundError(error)).toBe(false);
    });
  });
});
