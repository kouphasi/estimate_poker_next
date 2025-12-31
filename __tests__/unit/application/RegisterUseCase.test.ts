import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUseCase } from '@/application/auth/RegisterUseCase';
import { UserRepository } from '@/domain/user/UserRepository';
import { User } from '@/domain/user/User';
import { Email } from '@/domain/user/Email';
import bcrypt from 'bcryptjs';

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}));

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
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

    useCase = new RegisterUseCase(mockUserRepository);
    vi.clearAllMocks();
  });

  it('should register user with valid inputs', async () => {
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashedPassword123' as never);

    const email = Email.create('test@example.com');
    const expectedUser = User.createAuthenticated(
      'user-123',
      email,
      'Test User',
      'hashedPassword123'
    );
    vi.mocked(mockUserRepository.createAuthenticated).mockResolvedValue(
      expectedUser
    );

    const result = await useCase.execute(
      'test@example.com',
      'password123',
      'Test User'
    );

    expect(result).toBe(expectedUser);
    expect(mockUserRepository.createAuthenticated).toHaveBeenCalledWith(
      expect.any(Email),
      'Test User',
      'hashedPassword123'
    );
  });

  it('should throw error when email is empty', async () => {
    await expect(
      useCase.execute('', 'password123', 'Test User')
    ).rejects.toThrow('Email, password, and nickname are required');
  });

  it('should throw error when password is empty', async () => {
    await expect(
      useCase.execute('test@example.com', '', 'Test User')
    ).rejects.toThrow('Email, password, and nickname are required');
  });

  it('should throw error when nickname is empty', async () => {
    await expect(
      useCase.execute('test@example.com', 'password123', '')
    ).rejects.toThrow('Email, password, and nickname are required');
  });

  it('should throw error when nickname is whitespace only', async () => {
    await expect(
      useCase.execute('test@example.com', 'password123', '   ')
    ).rejects.toThrow('Nickname cannot be empty');
  });

  it('should throw error when nickname exceeds 50 characters', async () => {
    const longNickname = 'a'.repeat(51);
    await expect(
      useCase.execute('test@example.com', 'password123', longNickname)
    ).rejects.toThrow('Nickname must be 50 characters or less');
  });

  it('should throw error when password is too short', async () => {
    await expect(
      useCase.execute('test@example.com', 'short', 'Test User')
    ).rejects.toThrow('Password must be at least 8 characters');
  });

  it('should throw error when email already exists', async () => {
    const existingEmail = Email.create('existing@example.com');
    const existingUser = User.createAuthenticated(
      'existing-user',
      existingEmail,
      'Existing User',
      'hashedPassword'
    );
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser);

    await expect(
      useCase.execute('existing@example.com', 'password123', 'New User')
    ).rejects.toThrow('Email already exists');
  });

  it('should trim nickname', async () => {
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashedPassword123' as never);

    const email = Email.create('test@example.com');
    const expectedUser = User.createAuthenticated(
      'user-123',
      email,
      'Trimmed User',
      'hashedPassword123'
    );
    vi.mocked(mockUserRepository.createAuthenticated).mockResolvedValue(
      expectedUser
    );

    await useCase.execute('test@example.com', 'password123', '  Trimmed User  ');

    expect(mockUserRepository.createAuthenticated).toHaveBeenCalledWith(
      expect.any(Email),
      'Trimmed User',
      'hashedPassword123'
    );
  });

  it('should accept password with exactly 8 characters', async () => {
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashedPassword' as never);

    const email = Email.create('test@example.com');
    const expectedUser = User.createAuthenticated(
      'user-123',
      email,
      'Test User',
      'hashedPassword'
    );
    vi.mocked(mockUserRepository.createAuthenticated).mockResolvedValue(
      expectedUser
    );

    const result = await useCase.execute(
      'test@example.com',
      '12345678', // Exactly 8 characters
      'Test User'
    );

    expect(result).toBe(expectedUser);
  });

  it('should hash password with bcrypt', async () => {
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashedPassword123' as never);

    const email = Email.create('test@example.com');
    const expectedUser = User.createAuthenticated(
      'user-123',
      email,
      'Test User',
      'hashedPassword123'
    );
    vi.mocked(mockUserRepository.createAuthenticated).mockResolvedValue(
      expectedUser
    );

    await useCase.execute('test@example.com', 'mypassword', 'Test User');

    expect(bcrypt.hash).toHaveBeenCalledWith('mypassword', 10);
  });
});
