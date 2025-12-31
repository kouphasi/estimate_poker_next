import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListProjectSessionsUseCase } from '@/application/project/ListProjectSessionsUseCase';
import { ProjectRepository } from '@/domain/project/ProjectRepository';
import { SessionRepository } from '@/domain/session/SessionRepository';
import { Project } from '@/domain/project/Project';
import { EstimationSession } from '@/domain/session/EstimationSession';
import { ShareToken } from '@/domain/session/ShareToken';
import { OwnerToken } from '@/domain/session/OwnerToken';
import { NotFoundError, UnauthorizedError } from '@/domain/errors/DomainError';

describe('ListProjectSessionsUseCase', () => {
  let useCase: ListProjectSessionsUseCase;
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

    useCase = new ListProjectSessionsUseCase(mockProjectRepository, mockSessionRepository);
  });

  it('should return sessions for project owner', async () => {
    const project = Project.create(
      'project-123',
      'Test Project',
      null,
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);

    const sessions = [
      EstimationSession.create(
        'session-1',
        'Session 1',
        ShareToken.fromString('ABCDabcd12340001'),
        OwnerToken.fromString('ABCDabcd1234567890123456789012ab'),
        'owner-123',
        'project-123'
      ),
    ];
    vi.mocked(mockSessionRepository.findByProjectId).mockResolvedValue(sessions);

    const result = await useCase.execute('project-123', 'owner-123');

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].id).toBe('session-1');
    expect(result.sessions[0].name).toBe('Session 1');
  });

  it('should return empty array when no sessions', async () => {
    const project = Project.create(
      'project-123',
      'Test Project',
      null,
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);
    vi.mocked(mockSessionRepository.findByProjectId).mockResolvedValue([]);

    const result = await useCase.execute('project-123', 'owner-123');

    expect(result.sessions).toHaveLength(0);
  });

  it('should throw NotFoundError when project not found', async () => {
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute('non-existent', 'owner-123')
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
      useCase.execute('project-123', 'other-user')
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should map session properties correctly', async () => {
    const project = Project.create(
      'project-123',
      'Test Project',
      null,
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);

    const session = EstimationSession.create(
      'session-123',
      'Test Session',
      ShareToken.fromString('ABCDabcd12340000'),
      OwnerToken.fromString('ABCDabcd1234567890123456789012ab'),
      'owner-123',
      'project-123'
    );
    vi.mocked(mockSessionRepository.findByProjectId).mockResolvedValue([session]);

    const result = await useCase.execute('project-123', 'owner-123');

    expect(result.sessions[0]).toEqual({
      id: 'session-123',
      name: 'Test Session',
      shareToken: 'ABCDabcd12340000',
      status: 'ACTIVE',
      createdAt: expect.any(Date),
      estimatesCount: 0,
    });
  });
});
