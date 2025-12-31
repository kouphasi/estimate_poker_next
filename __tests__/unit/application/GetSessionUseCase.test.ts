import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSessionUseCase } from '@/application/session/GetSessionUseCase';
import { SessionRepository } from '@/domain/session/SessionRepository';
import { EstimateRepository } from '@/domain/session/EstimateRepository';
import { EstimationSession } from '@/domain/session/EstimationSession';
import { ShareToken } from '@/domain/session/ShareToken';
import { OwnerToken } from '@/domain/session/OwnerToken';
import { Estimate } from '@/domain/session/Estimate';
import { SessionStatus } from '@/domain/session/SessionStatus';
import { NotFoundError } from '@/domain/errors/DomainError';

describe('GetSessionUseCase', () => {
  let useCase: GetSessionUseCase;
  let mockSessionRepository: SessionRepository;
  let mockEstimateRepository: EstimateRepository;

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

    useCase = new GetSessionUseCase(mockSessionRepository, mockEstimateRepository);
  });

  it('should return session with estimates', async () => {
    const session = new EstimationSession(
      'session-123',
      'Test Session',
      ShareToken.fromString(validShareToken),
      OwnerToken.fromString(validOwnerToken),
      'owner-123',
      'project-123',
      false,
      SessionStatus.ACTIVE,
      null,
      new Date()
    );
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);

    const estimates = [
      Estimate.create('est-1', 'session-123', 'user-1', 'User 1', 5),
      Estimate.create('est-2', 'session-123', 'user-2', 'User 2', 8),
    ];
    vi.mocked(mockEstimateRepository.findBySessionId).mockResolvedValue(estimates);

    const result = await useCase.execute(validShareToken);

    expect(result.id).toBe('session-123');
    expect(result.name).toBe('Test Session');
    expect(result.shareToken).toBe(validShareToken);
    expect(result.ownerId).toBe('owner-123');
    expect(result.projectId).toBe('project-123');
    expect(result.isRevealed).toBe(false);
    expect(result.status).toBe(SessionStatus.ACTIVE);
    expect(result.estimates).toHaveLength(2);
  });

  it('should return session without estimates', async () => {
    const session = EstimationSession.create(
      'session-123',
      null,
      ShareToken.fromString(validShareToken),
      OwnerToken.fromString(validOwnerToken),
      null,
      null
    );
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);
    vi.mocked(mockEstimateRepository.findBySessionId).mockResolvedValue([]);

    const result = await useCase.execute(validShareToken);

    expect(result.estimates).toHaveLength(0);
  });

  it('should throw NotFoundError when session not found', async () => {
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(null);

    await expect(useCase.execute(validShareToken)).rejects.toThrow(NotFoundError);
  });

  it('should map estimate properties correctly', async () => {
    const session = EstimationSession.create(
      'session-123',
      null,
      ShareToken.fromString(validShareToken),
      OwnerToken.fromString(validOwnerToken),
      null,
      null
    );
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);

    const now = new Date();
    const estimate = new Estimate(
      'est-123',
      'session-123',
      'user-123',
      'Test User',
      5,
      now,
      now
    );
    vi.mocked(mockEstimateRepository.findBySessionId).mockResolvedValue([estimate]);

    const result = await useCase.execute(validShareToken);

    expect(result.estimates[0]).toEqual({
      id: 'est-123',
      nickname: 'Test User',
      value: 5,
      userId: 'user-123',
      createdAt: now,
      updatedAt: now,
    });
  });

  it('should return finalEstimate when session is finalized', async () => {
    const session = new EstimationSession(
      'session-123',
      'Test Session',
      ShareToken.fromString(validShareToken),
      OwnerToken.fromString(validOwnerToken),
      'owner-123',
      null,
      true,
      SessionStatus.FINALIZED,
      5.5,
      new Date()
    );
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);
    vi.mocked(mockEstimateRepository.findBySessionId).mockResolvedValue([]);

    const result = await useCase.execute(validShareToken);

    expect(result.status).toBe(SessionStatus.FINALIZED);
    expect(result.finalEstimate).toBe(5.5);
    expect(result.isRevealed).toBe(true);
  });
});
