import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteProjectUseCase } from '@/application/project/DeleteProjectUseCase';
import { ProjectRepository } from '@/domain/project/ProjectRepository';
import { Project } from '@/domain/project/Project';
import { NotFoundError, UnauthorizedError } from '@/domain/errors/DomainError';

describe('DeleteProjectUseCase', () => {
  let useCase: DeleteProjectUseCase;
  let mockProjectRepository: ProjectRepository;

  beforeEach(() => {
    mockProjectRepository = {
      findById: vi.fn(),
      findByOwnerId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      countSessions: vi.fn(),
      findByIdAndOwnerId: vi.fn(),
    };

    useCase = new DeleteProjectUseCase(mockProjectRepository);
  });

  it('should delete project for owner', async () => {
    const project = Project.create(
      'project-123',
      'Test Project',
      null,
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);
    vi.mocked(mockProjectRepository.delete).mockResolvedValue(undefined);

    await useCase.execute({
      projectId: 'project-123',
      requestUserId: 'owner-123',
    });

    expect(mockProjectRepository.delete).toHaveBeenCalledWith('project-123');
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

  it('should not call delete when project not found', async () => {
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(null);

    try {
      await useCase.execute({
        projectId: 'project-123',
        requestUserId: 'owner-123',
      });
    } catch {
      // Expected error
    }

    expect(mockProjectRepository.delete).not.toHaveBeenCalled();
  });

  it('should not call delete when unauthorized', async () => {
    const project = Project.create(
      'project-123',
      'Test Project',
      null,
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);

    try {
      await useCase.execute({
        projectId: 'project-123',
        requestUserId: 'other-user',
      });
    } catch {
      // Expected error
    }

    expect(mockProjectRepository.delete).not.toHaveBeenCalled();
  });
});
