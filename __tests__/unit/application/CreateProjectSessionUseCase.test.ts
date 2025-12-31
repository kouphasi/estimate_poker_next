import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateProjectSessionUseCase } from '@/application/project/CreateProjectSessionUseCase';
import { ProjectRepository } from '@/domain/project/ProjectRepository';
import { SessionRepository } from '@/domain/session/SessionRepository';
import { Project } from '@/domain/project/Project';
import { EstimationSession } from '@/domain/session/EstimationSession';
import { ShareToken } from '@/domain/session/ShareToken';
import { OwnerToken } from '@/domain/session/OwnerToken';
import { NotFoundError, UnauthorizedError } from '@/domain/errors/DomainError';

describe('CreateProjectSessionUseCase', () => {
  let useCase: CreateProjectSessionUseCase;
  let mockProjectRepository: ProjectRepository;
  let mockSessionRepository: SessionRepository;

  beforeEach(() => {
    mockProjectRepository = {
      findById: vi.fn(),
      findByOwnerId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      countSessions: vi.fn(),
      findByIdAndOwnerId: vi.fn(),
    };

    mockSessionRepository = {
      findByShareToken: vi.fn(),
      findById: vi.fn(),
      findByOwnerId: vi.fn(),
      findByProjectId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      findByShareTokenString: vi.fn(),
    };

    useCase = new CreateProjectSessionUseCase(mockProjectRepository, mockSessionRepository);
  });

  it('should create session for project owner', async () => {
    const project = Project.create(
      'project-123',
      'Test Project',
      null,
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);

    const savedSession = EstimationSession.create(
      'session-123',
      'New Session',
      ShareToken.fromString('ABCDabcd12340000'),
      OwnerToken.fromString('ABCDabcd1234567890123456789012ab'),
      'owner-123',
      'project-123'
    );
    vi.mocked(mockSessionRepository.save).mockResolvedValue(savedSession);

    const result = await useCase.execute({
      projectId: 'project-123',
      requestUserId: 'owner-123',
      name: 'New Session',
    });

    expect(result.sessionId).toBe('session-123');
    expect(result.name).toBe('New Session');
    expect(result.shareToken).toBe('ABCDabcd12340000');
    expect(result.ownerToken).toBe('ABCDabcd1234567890123456789012ab');
  });

  it('should create session without name', async () => {
    const project = Project.create(
      'project-123',
      'Test Project',
      null,
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);

    const savedSession = EstimationSession.create(
      'session-123',
      null,
      ShareToken.fromString('ABCDabcd12340000'),
      OwnerToken.fromString('ABCDabcd1234567890123456789012ab'),
      'owner-123',
      'project-123'
    );
    vi.mocked(mockSessionRepository.save).mockResolvedValue(savedSession);

    const result = await useCase.execute({
      projectId: 'project-123',
      requestUserId: 'owner-123',
    });

    expect(result.name).toBeNull();
  });

  it('should trim whitespace from session name', async () => {
    const project = Project.create(
      'project-123',
      'Test Project',
      null,
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);

    const savedSession = EstimationSession.create(
      'session-123',
      'Trimmed Name',
      ShareToken.fromString('ABCDabcd12340000'),
      OwnerToken.fromString('ABCDabcd1234567890123456789012ab'),
      'owner-123',
      'project-123'
    );
    vi.mocked(mockSessionRepository.save).mockResolvedValue(savedSession);

    await useCase.execute({
      projectId: 'project-123',
      requestUserId: 'owner-123',
      name: '  Trimmed Name  ',
    });

    expect(mockSessionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Trimmed Name' })
    );
  });

  it('should throw NotFoundError when project not found', async () => {
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({
        projectId: 'non-existent',
        requestUserId: 'owner-123',
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw UnauthorizedError for non-owner', async () => {
    const project = Project.create(
      'project-123',
      'Test Project',
      null,
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);

    await expect(
      useCase.execute({
        projectId: 'project-123',
        requestUserId: 'other-user',
      })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should link session to project', async () => {
    const project = Project.create(
      'project-123',
      'Test Project',
      null,
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);

    const savedSession = EstimationSession.create(
      'session-123',
      null,
      ShareToken.fromString('ABCDabcd12340000'),
      OwnerToken.fromString('ABCDabcd1234567890123456789012ab'),
      'owner-123',
      'project-123'
    );
    vi.mocked(mockSessionRepository.save).mockResolvedValue(savedSession);

    await useCase.execute({
      projectId: 'project-123',
      requestUserId: 'owner-123',
    });

    expect(mockSessionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'project-123' })
    );
  });

  it('should set session owner to request user', async () => {
    const project = Project.create(
      'project-123',
      'Test Project',
      null,
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);

    const savedSession = EstimationSession.create(
      'session-123',
      null,
      ShareToken.fromString('ABCDabcd12340000'),
      OwnerToken.fromString('ABCDabcd1234567890123456789012ab'),
      'owner-123',
      'project-123'
    );
    vi.mocked(mockSessionRepository.save).mockResolvedValue(savedSession);

    await useCase.execute({
      projectId: 'project-123',
      requestUserId: 'owner-123',
    });

    expect(mockSessionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: 'owner-123' })
    );
  });
});
