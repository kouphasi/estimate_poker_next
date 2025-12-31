import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListProjectsUseCase } from '@/application/project/ListProjectsUseCase';
import { ProjectRepository } from '@/domain/project/ProjectRepository';
import { Project } from '@/domain/project/Project';

describe('ListProjectsUseCase', () => {
  let useCase: ListProjectsUseCase;
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

    useCase = new ListProjectsUseCase(mockProjectRepository);
  });

  it('should return empty array when user has no projects', async () => {
    vi.mocked(mockProjectRepository.findByOwnerId).mockResolvedValue([]);

    const result = await useCase.execute('user-123');

    expect(result).toEqual([]);
    expect(mockProjectRepository.findByOwnerId).toHaveBeenCalledWith('user-123');
  });

  it('should return projects for user', async () => {
    const projects = [
      Project.create('project-1', 'Project 1', 'Description 1', 'user-123'),
      Project.create('project-2', 'Project 2', null, 'user-123'),
    ];
    vi.mocked(mockProjectRepository.findByOwnerId).mockResolvedValue(projects);

    const result = await useCase.execute('user-123');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('project-1');
    expect(result[0].name).toBe('Project 1');
    expect(result[0].description).toBe('Description 1');
    expect(result[1].id).toBe('project-2');
    expect(result[1].description).toBeNull();
  });

  it('should map all project properties correctly', async () => {
    const now = new Date();
    const project = new Project(
      'project-123',
      'Test Project',
      'Test Description',
      'user-123',
      now,
      now
    );
    vi.mocked(mockProjectRepository.findByOwnerId).mockResolvedValue([project]);

    const result = await useCase.execute('user-123');

    expect(result[0]).toEqual({
      id: 'project-123',
      name: 'Test Project',
      description: 'Test Description',
      ownerId: 'user-123',
      createdAt: now,
      updatedAt: now,
      sessionsCount: 0,
    });
  });

  it('should set sessionsCount to 0 by default', async () => {
    const project = Project.create('project-123', 'Test', null, 'user-123');
    vi.mocked(mockProjectRepository.findByOwnerId).mockResolvedValue([project]);

    const result = await useCase.execute('user-123');

    expect(result[0].sessionsCount).toBe(0);
  });
});
