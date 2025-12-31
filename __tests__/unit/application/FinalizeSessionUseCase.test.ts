import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinalizeSessionUseCase } from '@/application/session/FinalizeSessionUseCase';
import { SessionRepository } from '@/domain/session/SessionRepository';
import { EstimationSession } from '@/domain/session/EstimationSession';
import { ShareToken } from '@/domain/session/ShareToken';
import { OwnerToken } from '@/domain/session/OwnerToken';
import { SessionStatus } from '@/domain/session/SessionStatus';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/domain/errors/DomainError';

describe('FinalizeSessionUseCase', () => {
  let useCase: FinalizeSessionUseCase;
  let mockSessionRepository: SessionRepository;

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

    useCase = new FinalizeSessionUseCase(mockSessionRepository);
  });

  const createActiveSession = () =>
    new EstimationSession(
      'session-123',
      null,
      ShareToken.fromString(validShareToken),
      OwnerToken.fromString(validOwnerToken),
      null,
      null,
      false,
      SessionStatus.ACTIVE,
      null,
      new Date()
    );

  const createFinalizedSession = () =>
    new EstimationSession(
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

  it('should finalize active session', async () => {
    const session = createActiveSession();
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);
    vi.mocked(mockSessionRepository.save).mockImplementation(async (s) => s);

    const result = await useCase.execute({
      shareToken: validShareToken,
      ownerToken: validOwnerToken,
      finalEstimate: 5,
    });

    expect(result.status).toBe(SessionStatus.FINALIZED);
    expect(result.finalEstimate).toBe(5);
  });

  it('should set isRevealed to true when finalized', async () => {
    const session = createActiveSession();
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);
    vi.mocked(mockSessionRepository.save).mockImplementation(async (s) => s);

    await useCase.execute({
      shareToken: validShareToken,
      ownerToken: validOwnerToken,
      finalEstimate: 5,
    });

    expect(mockSessionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ isRevealed: true })
    );
  });

  it('should throw NotFoundError when session not found', async () => {
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(null);

    await expect(
      useCase.execute({
        shareToken: validShareToken,
        ownerToken: validOwnerToken,
        finalEstimate: 5,
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw UnauthorizedError for invalid owner token', async () => {
    const session = createActiveSession();
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);

    await expect(
      useCase.execute({
        shareToken: validShareToken,
        ownerToken: 'InvalidOwnerToken0000000000000',
        finalEstimate: 5,
      })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should throw ValidationError when session is already finalized', async () => {
    const session = createFinalizedSession();
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);

    await expect(
      useCase.execute({
        shareToken: validShareToken,
        ownerToken: validOwnerToken,
        finalEstimate: 10,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should accept decimal final estimate', async () => {
    const session = createActiveSession();
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);
    vi.mocked(mockSessionRepository.save).mockImplementation(async (s) => s);

    const result = await useCase.execute({
      shareToken: validShareToken,
      ownerToken: validOwnerToken,
      finalEstimate: 2.5,
    });

    expect(result.finalEstimate).toBe(2.5);
  });

  it('should return session id and shareToken', async () => {
    const session = createActiveSession();
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);
    vi.mocked(mockSessionRepository.save).mockImplementation(async (s) => s);

    const result = await useCase.execute({
      shareToken: validShareToken,
      ownerToken: validOwnerToken,
      finalEstimate: 5,
    });

    expect(result.id).toBe('session-123');
    expect(result.shareToken).toBe(validShareToken);
  });
});
