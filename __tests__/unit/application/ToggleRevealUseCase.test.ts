import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToggleRevealUseCase } from '@/application/session/ToggleRevealUseCase';
import { SessionRepository } from '@/domain/session/SessionRepository';
import { EstimationSession } from '@/domain/session/EstimationSession';
import { ShareToken } from '@/domain/session/ShareToken';
import { OwnerToken } from '@/domain/session/OwnerToken';
import { SessionStatus } from '@/domain/session/SessionStatus';
import { NotFoundError, UnauthorizedError } from '@/domain/errors/DomainError';

describe('ToggleRevealUseCase', () => {
  let useCase: ToggleRevealUseCase;
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

    useCase = new ToggleRevealUseCase(mockSessionRepository);
  });

  const createSession = (isRevealed: boolean) =>
    new EstimationSession(
      'session-123',
      null,
      ShareToken.fromString(validShareToken),
      OwnerToken.fromString(validOwnerToken),
      null,
      null,
      isRevealed,
      SessionStatus.ACTIVE,
      null,
      new Date()
    );

  it('should reveal hidden session when reveal is true', async () => {
    const session = createSession(false);
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);
    vi.mocked(mockSessionRepository.save).mockImplementation(async (s) => s);

    const result = await useCase.execute({
      shareToken: validShareToken,
      ownerToken: validOwnerToken,
      reveal: true,
    });

    expect(result.isRevealed).toBe(true);
  });

  it('should hide revealed session when reveal is false', async () => {
    const session = createSession(true);
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);
    vi.mocked(mockSessionRepository.save).mockImplementation(async (s) => s);

    const result = await useCase.execute({
      shareToken: validShareToken,
      ownerToken: validOwnerToken,
      reveal: false,
    });

    expect(result.isRevealed).toBe(false);
  });

  it('should toggle from hidden to revealed', async () => {
    const session = createSession(false);
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);
    vi.mocked(mockSessionRepository.save).mockImplementation(async (s) => s);

    const result = await useCase.execute({
      shareToken: validShareToken,
      ownerToken: validOwnerToken,
    });

    expect(result.isRevealed).toBe(true);
  });

  it('should toggle from revealed to hidden', async () => {
    const session = createSession(true);
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);
    vi.mocked(mockSessionRepository.save).mockImplementation(async (s) => s);

    const result = await useCase.execute({
      shareToken: validShareToken,
      ownerToken: validOwnerToken,
    });

    expect(result.isRevealed).toBe(false);
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
    const session = createSession(false);
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);

    await expect(
      useCase.execute({
        shareToken: validShareToken,
        ownerToken: 'InvalidOwnerToken0000000000000',
      })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should return session id and shareToken', async () => {
    const session = createSession(false);
    vi.mocked(mockSessionRepository.findByShareToken).mockResolvedValue(session);
    vi.mocked(mockSessionRepository.save).mockImplementation(async (s) => s);

    const result = await useCase.execute({
      shareToken: validShareToken,
      ownerToken: validOwnerToken,
      reveal: true,
    });

    expect(result.id).toBe('session-123');
    expect(result.shareToken).toBe(validShareToken);
  });
});
