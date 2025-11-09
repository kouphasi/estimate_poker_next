-- Step 1: Handle existing users table and users_old table
DO $$
BEGIN
    -- Case 1: users_old already exists (from previous failed migration)
    -- Do nothing, we'll use it later

    -- Case 2: users table exists with old structure (user_ids column)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_ids') THEN
            -- Old structure detected, rename to users_old (if not already exists)
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_old') THEN
                ALTER TABLE "users" RENAME TO "users_old";
            ELSE
                -- Both exist somehow, drop the old users table
                DROP TABLE "users" CASCADE;
            END IF;
        END IF;
    END IF;

    -- Case 3: users table exists with new structure but has orphaned constraints
    -- (from partial migration failure) - drop constraint if needed
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_ids') THEN
            -- New structure detected, drop old constraint if it exists
            IF EXISTS (
                SELECT 1 FROM pg_constraint c
                JOIN pg_class t ON c.conrelid = t.oid
                WHERE c.conname = 'users_pkey' AND t.relname = 'users'
            ) THEN
                ALTER TABLE "users" DROP CONSTRAINT "users_pkey";
            END IF;
        END IF;
    END IF;
END $$;

-- Step 2: Create new users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE "users" (
            "id" TEXT NOT NULL,
            "nickname" TEXT NOT NULL,
            "isGuest" BOOLEAN NOT NULL DEFAULT true,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "users_pkey" PRIMARY KEY ("id")
        );
    ELSE
        -- Table exists, ensure it has the right structure
        -- Add missing columns if needed
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id') THEN
            ALTER TABLE "users" ADD COLUMN "id" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'nickname') THEN
            ALTER TABLE "users" ADD COLUMN "nickname" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'isGuest') THEN
            ALTER TABLE "users" ADD COLUMN "isGuest" BOOLEAN NOT NULL DEFAULT true;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
            ALTER TABLE "users" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
        END IF;

        -- Add primary key constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            WHERE c.conname = 'users_pkey' AND t.relname = 'users'
        ) THEN
            -- Make id NOT NULL if it isn't already
            ALTER TABLE "users" ALTER COLUMN "id" SET NOT NULL;
            ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
        END IF;

        -- Make nickname NOT NULL if it isn't already
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'nickname' AND is_nullable = 'YES') THEN
            UPDATE "users" SET "nickname" = 'User' WHERE "nickname" IS NULL;
            ALTER TABLE "users" ALTER COLUMN "nickname" SET NOT NULL;
        END IF;
    END IF;
END $$;

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
