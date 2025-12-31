import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaProjectRepository } from '@/infrastructure/database/repositories/PrismaProjectRepository';
import { Project } from '@/domain/project/Project';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

describe('PrismaProjectRepository', () => {
  let repository: PrismaProjectRepository;
  let testUserId: string;
  let createdProjectIds: string[] = [];

  beforeEach(async () => {
    repository = new PrismaProjectRepository(prisma);

    // テスト用ユーザーを作成
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        nickname: 'Test User',
        passwordHash: 'dummy',
        isGuest: false,
      },
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    // テストで作成したプロジェクトを削除
    if (createdProjectIds.length > 0) {
      await prisma.projectMember.deleteMany({
        where: { projectId: { in: createdProjectIds } },
      });
      await prisma.project.deleteMany({
        where: { id: { in: createdProjectIds } },
      });
    }

    // テスト用ユーザーを削除
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId },
      });
    }

    createdProjectIds = [];
  });

  describe('save', () => {
    it('新規プロジェクト作成時、ProjectとProjectMemberを同時に作成する', async () => {
      const project = new Project(
        `proj_${Date.now()}`,
        'Test Project',
        'Test Description',
        testUserId,
        new Date(),
        new Date()
      );

      const savedProject = await repository.save(project);
      createdProjectIds.push(savedProject.id);

      // プロジェクトが作成されたことを確認
      expect(savedProject.id).toBe(project.id);
      expect(savedProject.name).toBe('Test Project');
      expect(savedProject.description).toBe('Test Description');

      // ProjectMemberが作成されたことを確認
      const projectMember = await prisma.projectMember.findFirst({
        where: {
          projectId: project.id,
          userId: testUserId,
        },
      });

      expect(projectMember).not.toBeNull();
      expect(projectMember?.role).toBe('OWNER');
      expect(projectMember?.userId).toBe(testUserId);
      expect(projectMember?.projectId).toBe(project.id);
    });

    it('既存プロジェクト更新時、ProjectMemberは作成しない', async () => {
      // まず新規プロジェクトを作成
      const project = new Project(
        `proj_${Date.now()}`,
        'Original Name',
        'Original Description',
        testUserId,
        new Date(),
        new Date()
      );

      const savedProject = await repository.save(project);
      createdProjectIds.push(savedProject.id);

      // ProjectMemberが1件作成されたことを確認
      const memberCountBefore = await prisma.projectMember.count({
        where: { projectId: project.id },
      });
      expect(memberCountBefore).toBe(1);

      // プロジェクトを更新
      const updatedProject = new Project(
        savedProject.id,
        'Updated Name',
        'Updated Description',
        testUserId,
        savedProject.createdAt,
        new Date()
      );

      await repository.save(updatedProject);

      // ProjectMemberの数が変わらないことを確認
      const memberCountAfter = await prisma.projectMember.count({
        where: { projectId: project.id },
      });
      expect(memberCountAfter).toBe(1);

      // プロジェクト情報が更新されたことを確認
      const retrieved = await repository.findById(savedProject.id);
      expect(retrieved?.name).toBe('Updated Name');
      expect(retrieved?.description).toBe('Updated Description');
    });
  });
});
