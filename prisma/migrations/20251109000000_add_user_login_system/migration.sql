-- Step 1: Rename old users table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Check if the old users table has the old structure (user_ids column)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_ids') THEN
            ALTER TABLE "users" RENAME TO "users_old";
        END IF;
    END IF;
END $$;

-- Step 2: Create new users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "isGuest" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Step 3: Add ownerId column to estimation_sessions
ALTER TABLE "estimation_sessions" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

-- Step 4: Add user_id column to estimates (nullable initially)
ALTER TABLE "estimates" ADD COLUMN IF NOT EXISTS "user_id" TEXT;

-- Step 5: Create default guest user for existing estimates if needed
DO $$
DECLARE
    guest_user_id TEXT := 'guest_default_user';
BEGIN
    -- Insert default guest user if there are estimates without user_id
    IF EXISTS (SELECT 1 FROM "estimates" WHERE "user_id" IS NULL) THEN
        INSERT INTO "users" ("id", "nickname", "isGuest", "created_at")
        VALUES (guest_user_id, 'Guest User', true, CURRENT_TIMESTAMP)
        ON CONFLICT ("id") DO NOTHING;

        -- Update existing estimates to reference the guest user
        UPDATE "estimates" SET "user_id" = guest_user_id WHERE "user_id" IS NULL;
    END IF;
END $$;

-- Step 6: Add foreign key constraints
ALTER TABLE "estimation_sessions" DROP CONSTRAINT IF EXISTS "estimation_sessions_ownerId_fkey";
ALTER TABLE "estimation_sessions" ADD CONSTRAINT "estimation_sessions_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "estimates" DROP CONSTRAINT IF EXISTS "estimates_user_id_fkey";
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 7: Drop old unique index and create new one
DROP INDEX IF EXISTS "estimates_session_id_nickname_key";
CREATE UNIQUE INDEX IF NOT EXISTS "estimates_session_id_user_id_key" ON "estimates"("session_id", "user_id");

-- Step 8: Drop old users table if it was renamed
DROP TABLE IF EXISTS "users_old" CASCADE;
