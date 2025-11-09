-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
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
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'estimation_sessions_ownerId_fkey'
    ) THEN
        ALTER TABLE "estimation_sessions" ADD CONSTRAINT "estimation_sessions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'estimates_user_id_fkey'
    ) THEN
        ALTER TABLE "estimates" ADD CONSTRAINT "estimates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- DropIndex
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'estimates_session_id_nickname_key'
    ) THEN
        DROP INDEX "estimates_session_id_nickname_key";
    END IF;
END $$;

-- CreateIndex
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'estimates_session_id_user_id_key'
    ) THEN
        CREATE UNIQUE INDEX "estimates_session_id_user_id_key" ON "estimates"("session_id", "user_id");
    END IF;
END $$;
