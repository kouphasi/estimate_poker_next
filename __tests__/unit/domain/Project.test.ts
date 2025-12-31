import { describe, it, expect } from 'vitest';
import { Project } from '@/domain/project/Project';

describe('Project Entity', () => {
  const now = new Date();

  describe('constructor', () => {
    it('should create project with all properties', () => {
      const project = new Project(
        'project-123',
        'Test Project',
        'Project description',
        'owner-123',
        now,
        now
      );

      expect(project.id).toBe('project-123');
      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('Project description');
      expect(project.ownerId).toBe('owner-123');
      expect(project.createdAt).toBe(now);
      expect(project.updatedAt).toBe(now);
    });

    it('should allow null description', () => {
      const project = new Project(
        'project-123',
        'Test Project',
        null,
        'owner-123',
        now,
        now
      );

      expect(project.description).toBeNull();
    });
  });

  describe('isOwnedBy', () => {
    it('should return true for matching owner id', () => {
      const project = Project.create(
        'project-123',
        'Test Project',
        null,
        'owner-123'
      );

      expect(project.isOwnedBy('owner-123')).toBe(true);
    });

    it('should return false for non-matching owner id', () => {
      const project = Project.create(
        'project-123',
        'Test Project',
        null,
        'owner-123'
      );

      expect(project.isOwnedBy('other-user')).toBe(false);
    });
  });

  describe('canBeDeletedBy', () => {
    it('should return true for owner', () => {
      const project = Project.create(
        'project-123',
        'Test Project',
        null,
        'owner-123'
      );

      expect(project.canBeDeletedBy('owner-123')).toBe(true);
    });

    it('should return false for non-owner', () => {
      const project = Project.create(
        'project-123',
        'Test Project',
        null,
        'owner-123'
      );

      expect(project.canBeDeletedBy('other-user')).toBe(false);
    });
  });

  describe('canBeUpdatedBy', () => {
    it('should return true for owner', () => {
      const project = Project.create(
        'project-123',
        'Test Project',
        null,
        'owner-123'
      );

      expect(project.canBeUpdatedBy('owner-123')).toBe(true);
    });

    it('should return false for non-owner', () => {
      const project = Project.create(
        'project-123',
        'Test Project',
        null,
        'owner-123'
      );

      expect(project.canBeUpdatedBy('other-user')).toBe(false);
    });
  });

  describe('update', () => {
    it('should update name only', () => {
      const original = Project.create(
        'project-123',
        'Original Name',
        'Description',
        'owner-123'
      );

      const updated = original.update({ name: 'New Name' });

      expect(updated.name).toBe('New Name');
      expect(updated.description).toBe('Description');
    });

    it('should update description only', () => {
      const original = Project.create(
        'project-123',
        'Project Name',
        'Original Description',
        'owner-123'
      );

      const updated = original.update({ description: 'New Description' });

      expect(updated.name).toBe('Project Name');
      expect(updated.description).toBe('New Description');
    });

    it('should update both name and description', () => {
      const original = Project.create(
        'project-123',
        'Original Name',
        'Original Description',
        'owner-123'
      );

      const updated = original.update({
        name: 'New Name',
        description: 'New Description',
      });

      expect(updated.name).toBe('New Name');
      expect(updated.description).toBe('New Description');
    });

    it('should allow setting description to null', () => {
      const original = Project.create(
        'project-123',
        'Project Name',
        'Description',
        'owner-123'
      );

      const updated = original.update({ description: null });

      expect(updated.description).toBeNull();
    });

    it('should not modify original project', () => {
      const original = Project.create(
        'project-123',
        'Original Name',
        'Original Description',
        'owner-123'
      );

      original.update({ name: 'New Name' });

      expect(original.name).toBe('Original Name');
    });

    it('should preserve id and ownerId', () => {
      const original = Project.create(
        'project-123',
        'Original Name',
        null,
        'owner-123'
      );

      const updated = original.update({ name: 'New Name' });

      expect(updated.id).toBe(original.id);
      expect(updated.ownerId).toBe(original.ownerId);
    });

    it('should update updatedAt timestamp', () => {
      const original = new Project(
        'project-123',
        'Name',
        null,
        'owner-123',
        new Date('2020-01-01'),
        new Date('2020-01-01')
      );

      const updated = original.update({ name: 'New Name' });

      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        original.updatedAt.getTime()
      );
    });

    it('should preserve createdAt timestamp', () => {
      const createdAt = new Date('2020-01-01');
      const original = new Project(
        'project-123',
        'Name',
        null,
        'owner-123',
        createdAt,
        createdAt
      );

      const updated = original.update({ name: 'New Name' });

      expect(updated.createdAt).toBe(createdAt);
    });
  });

  describe('create', () => {
    it('should create project with correct properties', () => {
      const project = Project.create(
        'project-123',
        'Test Project',
        'Description',
        'owner-123'
      );

      expect(project.id).toBe('project-123');
      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('Description');
      expect(project.ownerId).toBe('owner-123');
    });

    it('should set createdAt and updatedAt to same value', () => {
      const project = Project.create(
        'project-123',
        'Test Project',
        null,
        'owner-123'
      );

      expect(project.createdAt.getTime()).toBe(project.updatedAt.getTime());
    });

    it('should allow null description', () => {
      const project = Project.create(
        'project-123',
        'Test Project',
        null,
        'owner-123'
      );

      expect(project.description).toBeNull();
    });
  });
});
