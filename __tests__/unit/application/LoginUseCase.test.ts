import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginUseCase } from '@/application/auth/LoginUseCase';
import { UserRepository } from '@/domain/user/UserRepository';
import { User } from '@/domain/user/User';
import { Email } from '@/domain/user/Email';
import bcrypt from 'bcryptjs';

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}));

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      createGuest: vi.fn(),
      createAuthenticated: vi.fn(),
    };

    useCase = new LoginUseCase(mockUserRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should login successfully with valid credentials', async () => {
      const email = Email.create('test@example.com');
      const user = User.createAuthenticated(
        'user-123',
        email,
        'Test User',
        'hashedPassword123'
      );
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await useCase.execute('test@example.com', 'password123');

      expect(result.isValid).toBe(true);
      expect(result.user).toBe(user);
    });

    it('should throw error when email is empty', async () => {
      await expect(useCase.execute('', 'password123')).rejects.toThrow(
        'Email and password are required'
      );
    });

    it('should throw error when password is empty', async () => {
      await expect(useCase.execute('test@example.com', '')).rejects.toThrow(
        'Email and password are required'
      );
    });

    it('should throw error when user not found', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      await expect(
        useCase.execute('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error when user has no password hash (OAuth user)', async () => {
      const email = Email.create('oauth@example.com');
      const user = new User(
        'user-123',
        email,
        'OAuth User',
        false,
        new Date(),
        new Date(),
        null // No password hash
      );
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

      await expect(
        useCase.execute('oauth@example.com', 'password123')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error when password is invalid', async () => {
      const email = Email.create('test@example.com');
      const user = User.createAuthenticated(
        'user-123',
        email,
        'Test User',
        'hashedPassword123'
      );
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        useCase.execute('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('verifyCredentials', () => {
    it('should return user when credentials are valid', async () => {
      const email = Email.create('test@example.com');
      const user = User.createAuthenticated(
        'user-123',
        email,
        'Test User',
        'hashedPassword123'
      );
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await useCase.verifyCredentials(
        'test@example.com',
        'password123'
      );

      expect(result).toBe(user);
    });

    it('should return null when credentials are invalid', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      const result = await useCase.verifyCredentials(
        'nonexistent@example.com',
        'password123'
      );

      expect(result).toBeNull();
    });

    it('should return null when password is wrong', async () => {
      const email = Email.create('test@example.com');
      const user = User.createAuthenticated(
        'user-123',
        email,
        'Test User',
        'hashedPassword123'
      );
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await useCase.verifyCredentials(
        'test@example.com',
        'wrongpassword'
      );

      expect(result).toBeNull();
    });
  });
});
