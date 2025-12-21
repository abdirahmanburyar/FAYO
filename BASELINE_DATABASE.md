# Baseline Existing Database for Prisma

## Problem

The database already has tables/schema, but Prisma doesn't have migration history. We need to baseline it.

## Solution: Mark Current State as Baseline

### Option 1: Use `prisma migrate resolve` (Recommended)

```bash
cd /root/fayo/services/api-service

# Create an initial migration that matches current state
npx prisma migrate dev --name init --create-only

# Mark it as applied (without running it, since DB already has schema)
npx prisma migrate resolve --applied init
```

### Option 2: Use `prisma db push` (Quick fix, no migration history)

```bash
cd /root/fayo/services/api-service

# Sync schema without creating migrations
npx prisma db push --accept-data-loss
```

### Option 3: Create Baseline Migration Manually

```bash
cd /root/fayo/services/api-service

# 1. Create migrations directory if it doesn't exist
mkdir -p prisma/migrations

# 2. Create a baseline migration
npx prisma migrate dev --name baseline --create-only

# 3. Mark it as applied
npx prisma migrate resolve --applied baseline

# 4. Now you can run future migrations
npx prisma migrate deploy
```

## Recommended: Option 1

```bash
cd /root/fayo/services/api-service

# Step 1: Create initial migration (create-only, don't apply)
npx prisma migrate dev --name init --create-only

# Step 2: Mark it as already applied (since DB already has schema)
npx prisma migrate resolve --applied init

# Step 3: Verify
npx prisma migrate status

# Step 4: Now future migrations will work
npx prisma migrate deploy
```

## If Migration Creation Fails

If `prisma migrate dev --create-only` fails because schema doesn't match:

1. **Use `prisma db pull` to sync schema from database:**
   ```bash
   npx prisma db pull
   ```

2. **Then create baseline:**
   ```bash
   npx prisma migrate dev --name baseline --create-only
   npx prisma migrate resolve --applied baseline
   ```

## Verify

```bash
# Check migration status
npx prisma migrate status

# Should show: "Database schema is up to date"
```

