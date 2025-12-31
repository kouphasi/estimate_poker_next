import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateProjectUseCase } from '@/application/project/CreateProjectUseCase';
import { ProjectRepository } from '@/domain/project/ProjectRepository';
import { UserRepository } from '@/domain/user/UserRepository';
import { Project } from '@/domain/project/Project';
import { User } from '@/domain/user/User';
import { Email } from '@/domain/user/Email';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/domain/errors/DomainError';

describe('CreateProjectUseCase', () => {
  let useCase: CreateProjectUseCase;
  let mockProjectRepository: ProjectRepository;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    mockProjectRepository = {
      findById: vi.fn(),
      findByOwnerId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      countSessions: vi.fn(),
      findByIdAndOwnerId: vi.fn(),
    };

    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      createGuest: vi.fn(),
      createAuthenticated: vi.fn(),
    };

    useCase = new CreateProjectUseCase(mockProjectRepository, mockUserRepository);
  });

  it('should create project for authenticated user', async () => {
    const authenticatedUser = User.createAuthenticated(
      'user-123',
      Email.create('test@example.com'),
      'Test User',
      'hashedPassword'
    );
    vi.mocked(mockUserRepository.findById).mockResolvedValue(authenticatedUser);

    const savedProject = Project.create(
      'project-123',
      'Test Project',
      'Description',
      'user-123'
    );
    vi.mocked(mockProjectRepository.save).mockResolvedValue(savedProject);

    const result = await useCase.execute({
      name: 'Test Project',
      description: 'Description',
      ownerId: 'user-123',
    });

    expect(result.id).toBe('project-123');
    expect(result.name).toBe('Test Project');
    expect(result.description).toBe('Description');
    expect(result.ownerId).toBe('user-123');
  });

  it('should trim whitespace from project name', async () => {
    const authenticatedUser = User.createAuthenticated(
      'user-123',
      Email.create('test@example.com'),
      'Test User',
      'hashedPassword'
    );
    vi.mocked(mockUserRepository.findById).mockResolvedValue(authenticatedUser);

    const savedProject = Project.create(
      'project-123',
      'Trimmed Name',
      null,
      'user-123'
    );
    vi.mocked(mockProjectRepository.save).mockResolvedValue(savedProject);

    await useCase.execute({
      name: '  Trimmed Name  ',
      ownerId: 'user-123',
    });

    expect(mockProjectRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Trimmed Name' })
    );
  });

  it('should throw ValidationError for empty project name', async () => {
    await expect(
      useCase.execute({
        name: '',
        ownerId: 'user-123',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for whitespace-only project name', async () => {
    await expect(
      useCase.execute({
        name: '   ',
        ownerId: 'user-123',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should throw NotFoundError when user does not exist', async () => {
    vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({
        name: 'Test Project',
        ownerId: 'non-existent-user',
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw UnauthorizedError for guest user', async () => {
    const guestUser = User.createGuest('guest-123', 'Guest');
    vi.mocked(mockUserRepository.findById).mockResolvedValue(guestUser);

    await expect(
      useCase.execute({
        name: 'Test Project',
        ownerId: 'guest-123',
      })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should create project without description', async () => {
    const authenticatedUser = User.createAuthenticated(
      'user-123',
      Email.create('test@example.com'),
      'Test User',
      'hashedPassword'
    );
    vi.mocked(mockUserRepository.findById).mockResolvedValue(authenticatedUser);

    const savedProject = Project.create(
      'project-123',
      'Test Project',
      null,
      'user-123'
    );
    vi.mocked(mockProjectRepository.save).mockResolvedValue(savedProject);

    const result = await useCase.execute({
      name: 'Test Project',
      ownerId: 'user-123',
    });

    expect(result.description).toBeNull();
  });

  it('should trim whitespace from description', async () => {
    const authenticatedUser = User.createAuthenticated(
      'user-123',
      Email.create('test@example.com'),
      'Test User',
      'hashedPassword'
    );
    vi.mocked(mockUserRepository.findById).mockResolvedValue(authenticatedUser);

    const savedProject = Project.create(
      'project-123',
      'Test Project',
      'Trimmed Description',
      'user-123'
    );
    vi.mocked(mockProjectRepository.save).mockResolvedValue(savedProject);

    await useCase.execute({
      name: 'Test Project',
      description: '  Trimmed Description  ',
      ownerId: 'user-123',
    });

    expect(mockProjectRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Trimmed Description' })
    );
  });
});
