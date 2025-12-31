import { describe, it, expect } from 'vitest';
import { Email } from '@/domain/user/Email';
import { InvalidEmailError } from '@/domain/errors/DomainError';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create Email from valid email string', () => {
      const email = Email.create('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should create Email with subdomain', () => {
      const email = Email.create('user@mail.example.com');
      expect(email.value).toBe('user@mail.example.com');
    });

    it('should create Email with plus sign', () => {
      const email = Email.create('user+tag@example.com');
      expect(email.value).toBe('user+tag@example.com');
    });

    it('should create Email with dots in local part', () => {
      const email = Email.create('first.last@example.com');
      expect(email.value).toBe('first.last@example.com');
    });

    it('should create Email with numbers', () => {
      const email = Email.create('user123@example123.com');
      expect(email.value).toBe('user123@example123.com');
    });

    it('should throw InvalidEmailError for empty string', () => {
      expect(() => Email.create('')).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for missing @', () => {
      expect(() => Email.create('testexample.com')).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for missing domain', () => {
      expect(() => Email.create('test@')).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for missing local part', () => {
      expect(() => Email.create('@example.com')).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for missing TLD', () => {
      expect(() => Email.create('test@example')).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for spaces', () => {
      expect(() => Email.create('test @example.com')).toThrow(InvalidEmailError);
      expect(() => Email.create('test@ example.com')).toThrow(InvalidEmailError);
      expect(() => Email.create(' test@example.com')).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for multiple @ signs', () => {
      expect(() => Email.create('test@@example.com')).toThrow(InvalidEmailError);
    });
  });

  describe('equals', () => {
    it('should return true for same email addresses', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different email addresses', () => {
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });

    it('should return false for same local part but different domain', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@other.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const email = Email.create('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });
  });
});
