-- Step 1 & 2: Rename old users table and create new one (combined in one block)
DO $$
DECLARE
    has_users_table BOOLEAN;
    has_user_ids_column BOOLEAN;
    has_users_pkey BOOLEAN;
    has_id_column BOOLEAN;
    has_nickname_column BOOLEAN;
    has_isGuest_column BOOLEAN;
    has_created_at_column BOOLEAN;
    is_nickname_nullable BOOLEAN;
BEGIN
    -- Check if users table exists
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
    INTO has_users_table;

    IF has_users_table THEN
        -- Check if the old users table has the old structure (user_ids column)
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_ids')
        INTO has_user_ids_column;

        IF has_user_ids_column THEN
            -- This is the old structure, rename it
            -- Check if users_pkey constraint exists
            SELECT EXISTS (
                SELECT 1 FROM pg_constraint c
                JOIN pg_class t ON c.conrelid = t.oid
                WHERE c.conname = 'users_pkey' AND t.relname = 'users'
            ) INTO has_users_pkey;

            -- Drop the primary key constraint before renaming
            IF has_users_pkey THEN
                EXECUTE 'ALTER TABLE "users" DROP CONSTRAINT "users_pkey"';
            END IF;

            -- Rename the old table
            EXECUTE 'ALTER TABLE "users" RENAME TO "users_old"';

            -- Now create the new users table (we know it doesn't exist after rename)
            EXECUTE 'CREATE TABLE "users" (
                "id" TEXT NOT NULL,
                "nickname" TEXT NOT NULL,
                "isGuest" BOOLEAN NOT NULL DEFAULT true,
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "users_pkey" PRIMARY KEY ("id")
            )';
        ELSE
            -- New structure already exists, ensure it has all required columns
            SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id')
            INTO has_id_column;

            SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'nickname')
            INTO has_nickname_column;

            SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'isGuest')
            INTO has_isGuest_column;

            SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at')
            INTO has_created_at_column;

            -- Add missing columns if needed
            IF NOT has_id_column THEN
                EXECUTE 'ALTER TABLE "users" ADD COLUMN "id" TEXT';
            END IF;

            IF NOT has_nickname_column THEN
                EXECUTE 'ALTER TABLE "users" ADD COLUMN "nickname" TEXT';
            END IF;

            IF NOT has_isGuest_column THEN
                EXECUTE 'ALTER TABLE "users" ADD COLUMN "isGuest" BOOLEAN NOT NULL DEFAULT true';
            END IF;

            IF NOT has_created_at_column THEN
                EXECUTE 'ALTER TABLE "users" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP';
            END IF;

            -- Check if primary key constraint exists
            SELECT EXISTS (
                SELECT 1 FROM pg_constraint c
                JOIN pg_class t ON c.conrelid = t.oid
                WHERE c.conname = 'users_pkey' AND t.relname = 'users'
            ) INTO has_users_pkey;

            -- Add primary key constraint if it doesn't exist
            IF NOT has_users_pkey THEN
                -- Make id NOT NULL if it isn't already
                EXECUTE 'ALTER TABLE "users" ALTER COLUMN "id" SET NOT NULL';
                EXECUTE 'ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id")';
            END IF;

            -- Check if nickname is nullable
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'nickname' AND is_nullable = 'YES'
            ) INTO is_nickname_nullable;

            -- Make nickname NOT NULL if it isn't already
            IF is_nickname_nullable THEN
                EXECUTE 'UPDATE "users" SET "nickname" = ''User'' WHERE "nickname" IS NULL';
                EXECUTE 'ALTER TABLE "users" ALTER COLUMN "nickname" SET NOT NULL';
            END IF;
        END IF;
    ELSE
        -- No users table exists, create it
        EXECUTE 'CREATE TABLE "users" (
            "id" TEXT NOT NULL,
            "nickname" TEXT NOT NULL,
            "isGuest" BOOLEAN NOT NULL DEFAULT true,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "users_pkey" PRIMARY KEY ("id")
        )';
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
    has_null_user_estimates BOOLEAN;
BEGIN
    -- Check if there are estimates without user_id
    SELECT EXISTS (SELECT 1 FROM "estimates" WHERE "user_id" IS NULL)
    INTO has_null_user_estimates;

    IF has_null_user_estimates THEN
        -- Insert default guest user using EXECUTE
        EXECUTE format(
            'INSERT INTO "users" ("id", "nickname", "isGuest", "created_at") VALUES (%L, %L, %L, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING',
            guest_user_id, 'Guest User', true
        );

        -- Update existing estimates to reference the guest user using EXECUTE
        EXECUTE format(
            'UPDATE "estimates" SET "user_id" = %L WHERE "user_id" IS NULL',
            guest_user_id
        );
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
