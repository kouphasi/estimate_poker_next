-- CreateTable
CREATE TABLE IF NOT EXISTS "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tasks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "project_id" TEXT NOT NULL,
    "final_estimate" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "estimation_sessions"
  ADD COLUMN IF NOT EXISTS "task_id" TEXT,
  ALTER COLUMN "share_token" SET DATA TYPE TEXT,
  ALTER COLUMN "owner_token" SET DATA TYPE TEXT,
  ALTER COLUMN "is_revealed" SET DEFAULT false;

-- Rename columns if needed (check if they don't already have snake_case names)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'estimation_sessions' AND column_name = 'shareToken') THEN
        ALTER TABLE "estimation_sessions" RENAME COLUMN "shareToken" TO "share_token";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'estimation_sessions' AND column_name = 'ownerToken') THEN
        ALTER TABLE "estimation_sessions" RENAME COLUMN "ownerToken" TO "owner_token";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'estimation_sessions' AND column_name = 'ownerId') THEN
        ALTER TABLE "estimation_sessions" RENAME COLUMN "ownerId" TO "owner_id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'estimation_sessions' AND column_name = 'isRevealed') THEN
        ALTER TABLE "estimation_sessions" RENAME COLUMN "isRevealed" TO "is_revealed";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'estimation_sessions' AND column_name = 'finalEstimate') THEN
        ALTER TABLE "estimation_sessions" RENAME COLUMN "finalEstimate" TO "final_estimate";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'estimation_sessions' AND column_name = 'createdAt') THEN
        ALTER TABLE "estimation_sessions" RENAME COLUMN "createdAt" TO "created_at";
    END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "projects_owner_id_idx" ON "projects"("owner_id");
CREATE INDEX IF NOT EXISTS "tasks_project_id_idx" ON "tasks"("project_id");
CREATE INDEX IF NOT EXISTS "estimation_sessions_task_id_idx" ON "estimation_sessions"("task_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimation_sessions" ADD CONSTRAINT "estimation_sessions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
