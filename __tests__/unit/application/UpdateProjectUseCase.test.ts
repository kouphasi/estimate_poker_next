import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateProjectUseCase } from '@/application/project/UpdateProjectUseCase';
import { ProjectRepository } from '@/domain/project/ProjectRepository';
import { Project } from '@/domain/project/Project';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/domain/errors/DomainError';

describe('UpdateProjectUseCase', () => {
  let useCase: UpdateProjectUseCase;
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

    useCase = new UpdateProjectUseCase(mockProjectRepository);
  });

  it('should update project name', async () => {
    const project = Project.create(
      'project-123',
      'Old Name',
      'Description',
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);
    vi.mocked(mockProjectRepository.save).mockImplementation(async (p) => p);

    const result = await useCase.execute({
      projectId: 'project-123',
      requestUserId: 'owner-123',
      name: 'New Name',
    });

    expect(result.name).toBe('New Name');
    expect(result.description).toBe('Description');
  });

  it('should update project description', async () => {
    const project = Project.create(
      'project-123',
      'Project Name',
      'Old Description',
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);
    vi.mocked(mockProjectRepository.save).mockImplementation(async (p) => p);

    const result = await useCase.execute({
      projectId: 'project-123',
      requestUserId: 'owner-123',
      description: 'New Description',
    });

    expect(result.name).toBe('Project Name');
    expect(result.description).toBe('New Description');
  });

  it('should update both name and description', async () => {
    const project = Project.create(
      'project-123',
      'Old Name',
      'Old Description',
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);
    vi.mocked(mockProjectRepository.save).mockImplementation(async (p) => p);

    const result = await useCase.execute({
      projectId: 'project-123',
      requestUserId: 'owner-123',
      name: 'New Name',
      description: 'New Description',
    });

    expect(result.name).toBe('New Name');
    expect(result.description).toBe('New Description');
  });

  it('should trim whitespace from name', async () => {
    const project = Project.create(
      'project-123',
      'Old Name',
      null,
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);
    vi.mocked(mockProjectRepository.save).mockImplementation(async (p) => p);

    const result = await useCase.execute({
      projectId: 'project-123',
      requestUserId: 'owner-123',
      name: '  Trimmed Name  ',
    });

    expect(result.name).toBe('Trimmed Name');
  });

  it('should set description to null when empty string', async () => {
    const project = Project.create(
      'project-123',
      'Project Name',
      'Old Description',
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);
    vi.mocked(mockProjectRepository.save).mockImplementation(async (p) => p);

    const result = await useCase.execute({
      projectId: 'project-123',
      requestUserId: 'owner-123',
      description: '',
    });

    expect(result.description).toBeNull();
  });

  it('should throw NotFoundError when project not found', async () => {
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({
        projectId: 'non-existent',
        requestUserId: 'owner-123',
        name: 'New Name',
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw UnauthorizedError for non-owner', async () => {
    const project = Project.create(
      'project-123',
      'Project Name',
      null,
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);

    await expect(
      useCase.execute({
        projectId: 'project-123',
        requestUserId: 'other-user',
        name: 'New Name',
      })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should throw ValidationError for empty name', async () => {
    const project = Project.create(
      'project-123',
      'Project Name',
      null,
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);

    await expect(
      useCase.execute({
        projectId: 'project-123',
        requestUserId: 'owner-123',
        name: '',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for whitespace-only name', async () => {
    const project = Project.create(
      'project-123',
      'Project Name',
      null,
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);

    await expect(
      useCase.execute({
        projectId: 'project-123',
        requestUserId: 'owner-123',
        name: '   ',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should return updated timestamp', async () => {
    const project = Project.create(
      'project-123',
      'Project Name',
      null,
      'owner-123'
    );
    vi.mocked(mockProjectRepository.findById).mockResolvedValue(project);
    vi.mocked(mockProjectRepository.save).mockImplementation(async (p) => p);

    const result = await useCase.execute({
      projectId: 'project-123',
      requestUserId: 'owner-123',
      name: 'New Name',
    });

    expect(result.updatedAt).toBeDefined();
    expect(result.updatedAt).toBeInstanceOf(Date);
  });
});
