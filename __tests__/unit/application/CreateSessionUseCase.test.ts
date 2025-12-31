import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSessionUseCase } from '@/application/session/CreateSessionUseCase';
import { SessionRepository } from '@/domain/session/SessionRepository';
import { UserRepository } from '@/domain/user/UserRepository';
import { EstimationSession } from '@/domain/session/EstimationSession';
import { ShareToken } from '@/domain/session/ShareToken';
import { OwnerToken } from '@/domain/session/OwnerToken';
import { User } from '@/domain/user/User';
import { SessionStatus } from '@/domain/session/SessionStatus';
import { UnauthorizedError } from '@/domain/errors/DomainError';

describe('CreateSessionUseCase', () => {
  let useCase: CreateSessionUseCase;
  let mockSessionRepository: SessionRepository;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    mockSessionRepository = {
      findByShareToken: vi.fn(),
      findById: vi.fn(),
      findByOwnerId: vi.fn(),
      findByProjectId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      findByShareTokenString: vi.fn(),
    };

    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      createGuest: vi.fn(),
      createAuthenticated: vi.fn(),
    };

    useCase = new CreateSessionUseCase(mockSessionRepository, mockUserRepository);
  });

  it('should create session without owner', async () => {
    const savedSession = EstimationSession.create(
      'session-123',
      null,
      ShareToken.fromString('ABCDabcd12340000'),
      OwnerToken.fromString('ABCDabcd1234567890123456789012ab'),
      null,
      null
    );
    vi.mocked(mockSessionRepository.save).mockResolvedValue(savedSession);

    const result = await useCase.execute({});

    expect(result.id).toBe('session-123');
    expect(result.ownerId).toBeNull();
    expect(result.projectId).toBeNull();
    expect(result.isRevealed).toBe(false);
    expect(result.status).toBe(SessionStatus.ACTIVE);
  });

  it('should create session with name', async () => {
    const savedSession = EstimationSession.create(
      'session-123',
      'Test Session',
      ShareToken.fromString('ABCDabcd12340000'),
      OwnerToken.fromString('ABCDabcd1234567890123456789012ab'),
      null,
      null
    );
    vi.mocked(mockSessionRepository.save).mockResolvedValue(savedSession);

    const result = await useCase.execute({ name: 'Test Session' });

    expect(result.name).toBe('Test Session');
  });

  it('should create session with owner', async () => {
    const user = User.createGuest('user-123', 'Test User');
    vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

    const savedSession = EstimationSession.create(
      'session-123',
      null,
      ShareToken.fromString('ABCDabcd12340000'),
      OwnerToken.fromString('ABCDabcd1234567890123456789012ab'),
      'user-123',
      null
    );
    vi.mocked(mockSessionRepository.save).mockResolvedValue(savedSession);

    const result = await useCase.execute({ ownerId: 'user-123' });

    expect(result.ownerId).toBe('user-123');
    expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
  });

  it('should create session with project', async () => {
    const savedSession = EstimationSession.create(
      'session-123',
      null,
      ShareToken.fromString('ABCDabcd12340000'),
      OwnerToken.fromString('ABCDabcd1234567890123456789012ab'),
      null,
      'project-123'
    );
    vi.mocked(mockSessionRepository.save).mockResolvedValue(savedSession);

    const result = await useCase.execute({ projectId: 'project-123' });

    expect(result.projectId).toBe('project-123');
  });

  it('should throw UnauthorizedError when owner not found', async () => {
    vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ ownerId: 'non-existent-user' })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should return generated share token', async () => {
    const savedSession = EstimationSession.create(
      'session-123',
      null,
      ShareToken.fromString('ABCDabcd12340000'),
      OwnerToken.fromString('ABCDabcd1234567890123456789012ab'),
      null,
      null
    );
    vi.mocked(mockSessionRepository.save).mockResolvedValue(savedSession);

    const result = await useCase.execute({});

    expect(result.shareToken).toBe('ABCDabcd12340000');
    expect(result.ownerToken).toBe('ABCDabcd1234567890123456789012ab');
  });
});
