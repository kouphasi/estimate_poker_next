-- Drop the old users table if it exists (with old structure)
DROP TABLE IF EXISTS "users" CASCADE;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "isGuest" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "estimation_sessions" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

-- AlterTable
ALTER TABLE "estimates" ADD COLUMN IF NOT EXISTS "user_id" TEXT;

-- AddForeignKey
ALTER TABLE "estimation_sessions" DROP CONSTRAINT IF EXISTS "estimation_sessions_ownerId_fkey";
ALTER TABLE "estimation_sessions" ADD CONSTRAINT "estimation_sessions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" DROP CONSTRAINT IF EXISTS "estimates_user_id_fkey";
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex
DROP INDEX IF EXISTS "estimates_session_id_nickname_key";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "estimates_session_id_user_id_key" ON "estimates"("session_id", "user_id");
