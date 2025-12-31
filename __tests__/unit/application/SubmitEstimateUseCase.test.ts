import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmitEstimateUseCase } from '@/application/session/SubmitEstimateUseCase';
import { SessionRepository } from '@/domain/session/SessionRepository';
import { EstimateRepository } from '@/domain/session/EstimateRepository';
import { UserRepository } from '@/domain/user/UserRepository';
import { EstimationSession } from '@/domain/session/EstimationSession';
import { ShareToken } from '@/domain/session/ShareToken';
import { OwnerToken } from '@/domain/session/OwnerToken';
import { Estimate } from '@/domain/session/Estimate';
import { User } from '@/domain/user/User';
import { SessionStatus } from '@/domain/session/SessionStatus';
import { NotFoundError, ValidationError } from '@/domain/errors/DomainError';

describe('SubmitEstimateUseCase', () => {
  let useCase: SubmitEstimateUseCase;
  let mockSessionRepository: SessionRepository;
  let mockEstimateRepository: EstimateRepository;
  let mockUserRepository: UserRepository;

  const validShareToken = 'ABCDabcd12340000';
  const validOwnerToken = 'ABCDabcd1234567890123456789012ab';

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

    mockEstimateRepository = {
      findBySessionId: vi.fn(),
      findBySessionAndUser: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      deleteBySessionId: vi.fn(),
      upsert: vi.fn(),
    };

    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      createGuest: vi.fn(),
      createAuthenticated: vi.fn(),
    };

    useCase = new SubmitEstimateUseCase(
      mockSessionRepository,
      mockEstimateRepository,
      mockUserRepository
    );
  });

  const createActiveSession = () =>
    EstimationSession.create(
      'session-123',
      null,
      ShareToken.fromString(validShareToken),
      OwnerToken.fromString(validOwnerToken),
      null,
      null
    );

  it('should create new estimate for new user', async () => {
    const session = createActiveSession();
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);

    const user = User.createGuest('user-123', 'Test User');
    vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

    vi.mocked(mockEstimateRepository.findBySessionAndUser).mockResolvedValue(null);

    const savedEstimate = Estimate.create(
      'estimate-123',
      'session-123',
      'user-123',
      'Test User',
      5
    );
    vi.mocked(mockEstimateRepository.save).mockResolvedValue(savedEstimate);

    const result = await useCase.execute({
      shareToken: validShareToken,
      userId: 'user-123',
      nickname: 'Test User',
      value: 5,
    });

    expect(result.id).toBe('estimate-123');
    expect(result.sessionId).toBe('session-123');
    expect(result.userId).toBe('user-123');
    expect(result.nickname).toBe('Test User');
    expect(result.value).toBe(5);
  });

  it('should update existing estimate', async () => {
    const session = createActiveSession();
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);

    const user = User.createGuest('user-123', 'Test User');
    vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

    const existingEstimate = Estimate.create(
      'estimate-123',
      'session-123',
      'user-123',
      'Test User',
      5
    );
    vi.mocked(mockEstimateRepository.findBySessionAndUser).mockResolvedValue(
      existingEstimate
    );

    const updatedEstimate = existingEstimate.update(10);
    vi.mocked(mockEstimateRepository.save).mockResolvedValue(updatedEstimate);

    const result = await useCase.execute({
      shareToken: validShareToken,
      userId: 'user-123',
      nickname: 'Test User',
      value: 10,
    });

    expect(result.value).toBe(10);
  });

  it('should throw NotFoundError when session not found', async () => {
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(null);

    await expect(
      useCase.execute({
        shareToken: validShareToken,
        userId: 'user-123',
        nickname: 'Test User',
        value: 5,
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw ValidationError when session is finalized', async () => {
    const finalizedSession = new EstimationSession(
      'session-123',
      null,
      ShareToken.fromString(validShareToken),
      OwnerToken.fromString(validOwnerToken),
      null,
      null,
      true,
      SessionStatus.FINALIZED,
      5,
      new Date()
    );
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(
      finalizedSession
    );

    await expect(
      useCase.execute({
        shareToken: validShareToken,
        userId: 'user-123',
        nickname: 'Test User',
        value: 5,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should throw NotFoundError when user not found', async () => {
    const session = createActiveSession();
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);
    vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({
        shareToken: validShareToken,
        userId: 'non-existent-user',
        nickname: 'Test User',
        value: 5,
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('should accept zero value estimate', async () => {
    const session = createActiveSession();
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);

    const user = User.createGuest('user-123', 'Test User');
    vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

    vi.mocked(mockEstimateRepository.findBySessionAndUser).mockResolvedValue(null);

    const savedEstimate = Estimate.create(
      'estimate-123',
      'session-123',
      'user-123',
      'Test User',
      0
    );
    vi.mocked(mockEstimateRepository.save).mockResolvedValue(savedEstimate);

    const result = await useCase.execute({
      shareToken: validShareToken,
      userId: 'user-123',
      nickname: 'Test User',
      value: 0,
    });

    expect(result.value).toBe(0);
  });

  it('should accept decimal value estimate', async () => {
    const session = createActiveSession();
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);

    const user = User.createGuest('user-123', 'Test User');
    vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

    vi.mocked(mockEstimateRepository.findBySessionAndUser).mockResolvedValue(null);

    const savedEstimate = Estimate.create(
      'estimate-123',
      'session-123',
      'user-123',
      'Test User',
      2.5
    );
    vi.mocked(mockEstimateRepository.save).mockResolvedValue(savedEstimate);

    const result = await useCase.execute({
      shareToken: validShareToken,
      userId: 'user-123',
      nickname: 'Test User',
      value: 2.5,
    });

    expect(result.value).toBe(2.5);
  });
});
