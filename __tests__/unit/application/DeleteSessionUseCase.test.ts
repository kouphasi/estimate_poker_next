import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteSessionUseCase } from '@/application/session/DeleteSessionUseCase';
import { SessionRepository } from '@/domain/session/SessionRepository';
import { EstimationSession } from '@/domain/session/EstimationSession';
import { ShareToken } from '@/domain/session/ShareToken';
import { OwnerToken } from '@/domain/session/OwnerToken';
import { SessionStatus } from '@/domain/session/SessionStatus';
import { NotFoundError, UnauthorizedError } from '@/domain/errors/DomainError';

describe('DeleteSessionUseCase', () => {
  let useCase: DeleteSessionUseCase;
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

    useCase = new DeleteSessionUseCase(mockSessionRepository);
  });

  const createSession = () =>
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

  it('should delete session with valid owner token', async () => {
    const session = createSession();
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);
    vi.mocked(mockSessionRepository.delete).mockResolvedValue(undefined);

    await useCase.execute({
      shareToken: validShareToken,
      ownerToken: validOwnerToken,
    });

    expect(mockSessionRepository.delete).toHaveBeenCalledWith('session-123');
  });

  it('should throw NotFoundError when session not found', async () => {
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(null);

    await expect(
      useCase.execute({
        shareToken: validShareToken,
        ownerToken: validOwnerToken,
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw UnauthorizedError for invalid owner token', async () => {
    const session = createSession();
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);

    await expect(
      useCase.execute({
        shareToken: validShareToken,
        ownerToken: 'InvalidOwnerToken0000000000000',
      })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should not call delete when session not found', async () => {
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(null);

    try {
      await useCase.execute({
        shareToken: validShareToken,
        ownerToken: validOwnerToken,
      });
    } catch {
      // Expected error
    }

    expect(mockSessionRepository.delete).not.toHaveBeenCalled();
  });

  it('should not call delete when unauthorized', async () => {
    const session = createSession();
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);

    try {
      await useCase.execute({
        shareToken: validShareToken,
        ownerToken: 'InvalidOwnerToken0000000000000',
      });
    } catch {
      // Expected error
    }

    expect(mockSessionRepository.delete).not.toHaveBeenCalled();
  });
});
