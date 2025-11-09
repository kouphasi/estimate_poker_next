# Migration Recovery Guide

## Issue
The migration `20251109000000_add_user_login_system` failed during deployment to production.

## Root Cause
The original migration attempted to:
1. DROP the existing `users` table completely
2. Add `user_id` foreign key to `estimates` table
3. This failed because existing `estimates` records would have NULL `user_id` values, violating foreign key constraints

## Solution Applied

### 1. Fixed Migration File
Updated `/prisma/migrations/20251109000000_add_user_login_system/migration.sql` to:
- Rename the old `users` table instead of dropping it
- Create the new `users` table structure
- Add `user_id` column to `estimates` (nullable initially)
- Create a default guest user for existing estimates
- Update existing estimates to reference the guest user
- Add foreign key constraints safely
- Clean up the old table

### 2. Updated CI/CD Workflow
Modified `.github/workflows/db-migration.yml` to:
- Check migration status before deploying
- Automatically resolve failed migrations with `--rolled-back` flag
- Retry the migration with the fixed SQL

## Manual Recovery (if needed)

If you need to manually resolve the failed migration:

```bash
# 1. Mark the failed migration as rolled back
npx prisma migrate resolve --rolled-back 20251109000000_add_user_login_system

# 2. Deploy migrations again
npx prisma migrate deploy

# 3. Verify migration status
npx prisma migrate status
```

## Prevention

The updated migration now:
- ✅ Preserves existing data
- ✅ Handles NULL values for foreign keys
- ✅ Creates default guest users for existing estimates
- ✅ Uses conditional logic to check table structure
- ✅ Safely renames old tables instead of dropping them

## Testing

Before deploying to production, test locally:

```bash
# Reset database
npx prisma migrate reset

# Deploy migrations
npx prisma migrate deploy

# Verify
npx prisma migrate status
```
