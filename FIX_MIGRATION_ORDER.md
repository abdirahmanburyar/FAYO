# Fix Migration Order Issue

## Problem

The migration `20251115212150_init` is trying to create tables with foreign keys to `hospitals.hospitals`, but that table doesn't exist because the first migration `20250927034950_init` wasn't applied.

## Solution

We need to manually apply the first migration first, then the rest.

## Steps to Fix

### Step 1: Check migration status
```bash
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma migrate status"
```

### Step 2: Manually apply the first migration
```bash
# Apply the first migration that creates the hospitals table
docker exec -i postgres psql -U postgres -d hospital_service << 'EOF'
-- CreateSchema (already exists, but safe to run)
CREATE SCHEMA IF NOT EXISTS "hospitals";

-- CreateEnum
CREATE TYPE "hospitals"."HospitalType" AS ENUM ('HOSPITAL', 'CLINIC');

-- CreateTable
CREATE TABLE IF NOT EXISTS "hospitals"."hospitals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "hospitals"."HospitalType" NOT NULL DEFAULT 'HOSPITAL',
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);
EOF
```

### Step 3: Mark the first migration as applied
```bash
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma migrate resolve --applied 20250927034950_init"
```

### Step 4: Now run the remaining migrations
```bash
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma migrate deploy"
```

### Step 5: Verify all tables exist
```bash
docker exec -i postgres psql -U postgres -d hospital_service -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'hospitals' ORDER BY table_name;"
```

### Step 6: Restart the service
```bash
docker compose -f docker-compose.prod.yml restart hospital-service
```

