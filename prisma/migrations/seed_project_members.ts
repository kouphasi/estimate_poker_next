/**
 * データマイグレーション: 既存プロジェクトのオーナーをProjectMemberとして登録
 *
 * 実行方法:
 * npx tsx prisma/migrations/seed_project_members.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data migration: seed_project_members');

  // 既存のプロジェクトを取得
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      ownerId: true,
      createdAt: true,
    },
  });

  console.log(`Found ${projects.length} projects`);

  let inserted = 0;
  let skipped = 0;

  for (const project of projects) {
    // 既にProjectMemberとして登録されているか確認
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: project.ownerId,
        },
      },
    });

    if (existingMember) {
      console.log(`Skipping project ${project.id}: owner already registered as member`);
      skipped++;
      continue;
    }

    // ProjectMemberレコードを作成
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: project.ownerId,
        role: 'OWNER',
        joinedAt: project.createdAt,
      },
    });

    console.log(`Created ProjectMember for project ${project.id} (owner: ${project.ownerId})`);
    inserted++;
  }

  console.log(`\nData migration complete:`);
  console.log(`- Inserted: ${inserted}`);
  console.log(`- Skipped: ${skipped}`);
  console.log(`- Total: ${projects.length}`);
}

main()
  .catch((error) => {
    console.error('Error during migration:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
