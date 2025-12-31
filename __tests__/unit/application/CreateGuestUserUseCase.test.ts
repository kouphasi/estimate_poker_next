import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateGuestUserUseCase } from '@/application/auth/CreateGuestUserUseCase';
import { UserRepository } from '@/domain/user/UserRepository';
import { User } from '@/domain/user/User';

describe('CreateGuestUserUseCase', () => {
  let useCase: CreateGuestUserUseCase;
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

    useCase = new CreateGuestUserUseCase(mockUserRepository);
  });

  it('should create guest user with valid nickname', async () => {
    const expectedUser = User.createGuest('user-123', 'TestUser');
    vi.mocked(mockUserRepository.createGuest).mockResolvedValue(expectedUser);

    const result = await useCase.execute('TestUser');

    expect(mockUserRepository.createGuest).toHaveBeenCalledWith('TestUser');
    expect(result).toBe(expectedUser);
    expect(result.nickname).toBe('TestUser');
    expect(result.isGuest).toBe(true);
  });

  it('should trim whitespace from nickname', async () => {
    const expectedUser = User.createGuest('user-123', 'TrimmedUser');
    vi.mocked(mockUserRepository.createGuest).mockResolvedValue(expectedUser);

    await useCase.execute('  TrimmedUser  ');

    expect(mockUserRepository.createGuest).toHaveBeenCalledWith('TrimmedUser');
  });

  it('should throw error for empty nickname', async () => {
    await expect(useCase.execute('')).rejects.toThrow('Nickname is required');
  });

  it('should throw error for whitespace-only nickname', async () => {
    await expect(useCase.execute('   ')).rejects.toThrow('Nickname is required');
  });

  it('should throw error for nickname longer than 50 characters', async () => {
    const longNickname = 'a'.repeat(51);

    await expect(useCase.execute(longNickname)).rejects.toThrow(
      'Nickname must be 50 characters or less'
    );
  });

  it('should accept nickname with exactly 50 characters', async () => {
    const maxLengthNickname = 'a'.repeat(50);
    const expectedUser = User.createGuest('user-123', maxLengthNickname);
    vi.mocked(mockUserRepository.createGuest).mockResolvedValue(expectedUser);

    const result = await useCase.execute(maxLengthNickname);

    expect(result.nickname).toBe(maxLengthNickname);
  });
});
