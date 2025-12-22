# Safe Migration Guide - Add FCM Tokens Table Without Data Loss

## Problem
`npx prisma db push` warns about potential data loss due to unique constraints on existing tables. We only need to add the new `FcmToken` table, which won't affect existing data.

## Solution: Create Migration Manually

### Option 1: Run SQL Directly (Safest - No Data Loss)

```bash
cd services/api-service

# Run the SQL migration directly
sudo -u postgres psql -d fayo -f create_fcm_token_migration.sql

# Then generate Prisma client
npx prisma generate
```

### Option 2: Create Prisma Migration (Recommended for Production)

```bash
cd services/api-service

# 1. First, check for duplicates (optional but recommended)
sudo -u postgres psql -d fayo -f check_duplicates.sql

# 2. Create a migration file manually
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_add_fcm_tokens

# 3. Copy the SQL to the migration file
cp create_fcm_token_migration.sql prisma/migrations/$(ls -t prisma/migrations | head -1)/migration.sql

# 4. Mark migration as applied (since we'll run SQL directly)
npx prisma migrate resolve --applied $(ls -t prisma/migrations | head -1)

# 5. Generate Prisma client
npx prisma generate
```

### Option 3: Use Prisma Migrate Dev (If No Duplicates)

If you've checked and fixed all duplicates:

```bash
cd services/api-service

# This will create a migration file you can review
npx prisma migrate dev --name add_fcm_tokens --create-only

# Review the generated SQL in prisma/migrations/.../migration.sql
# Then apply it:
npx prisma migrate deploy
```

## Verify Migration

```bash
# Check if table exists
sudo -u postgres psql -d fayo -c "\d users.fcm_tokens"

# Or using Prisma
npx prisma db execute --stdin <<< "SELECT * FROM users.fcm_tokens LIMIT 1;"
```

## Why This Is Safe

- ✅ Only creates a NEW table (`fcm_tokens`)
- ✅ Doesn't modify existing tables
- ✅ Doesn't add constraints to existing tables
- ✅ No data loss risk
- ✅ Can be rolled back easily (just drop the table)

## If You Need to Fix Duplicates First

If you have duplicates in existing tables, fix them before adding unique constraints:

```sql
-- Example: Fix duplicate emails
UPDATE users.users 
SET email = email || '_' || id 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY "createdAt") as rn
    FROM users.users
    WHERE email IS NOT NULL
  ) t WHERE rn > 1
);
```

Then you can safely add unique constraints later.

