-- AlterTable
ALTER TABLE "estimation_sessions" ADD COLUMN "ownerToken" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "estimation_sessions_ownerToken_key" ON "estimation_sessions"("ownerToken");
