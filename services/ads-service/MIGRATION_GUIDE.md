# Ads Service Database Setup Guide

This guide explains how to set up the ads-service database schema using Docker PostgreSQL.

## Quick Start

**To create the database schema, use this single command:**

```bash
cat services/ads-service/ads-service.sql | docker exec -i postgres psql -U postgres
```

Or if you need to specify a database:

```bash
cat services/ads-service/ads-service.sql | docker exec -i postgres psql -U postgres -d ads_service
```

## Prerequisites

1. Docker and Docker Compose installed
2. PostgreSQL container running
3. Access to the database

## Schema Overview

The schema creates:
- `ads` schema
- `AdStatus` enum: `INACTIVE`, `PENDING`, `ACTIVE`, `EXPIRED`, `PUBLISHED`
- `AdType` enum: `BANNER`, `CAROUSEL`, `INTERSTITIAL`
- `ads.ads` table with all required columns:
  - `id`, `title`, `description`, `company`, `imageUrl`, `linkUrl`
  - `type`, `status`, `price`, `startDate`, `endDate`
  - `priority`, `clickCount`, `viewCount`, `createdBy`
  - `createdAt`, `updatedAt`

## Setup Steps

### Option 1: Direct Execution (Recommended)

Execute the SQL file directly:

```bash
cat services/ads-service/ads-service.sql | docker exec -i postgres psql -U postgres
```

### Option 2: Copy and Execute

1. **Copy the SQL file into the container:**
   ```bash
   docker cp services/ads-service/ads-service.sql postgres:/tmp/ads-service.sql
   ```

2. **Execute the SQL file:**
   ```bash
   docker exec -i postgres psql -U postgres -f /tmp/ads-service.sql
   ```

## Verification

After running the SQL file, verify the schema:

```bash
# Check table structure
docker exec -i postgres psql -U postgres -c "\d ads.ads"

# Check enum values
docker exec -i postgres psql -U postgres -c "SELECT unnest(enum_range(NULL::ads.\"AdStatus\")) AS status_values;"
docker exec -i postgres psql -U postgres -c "SELECT unnest(enum_range(NULL::ads.\"AdType\")) AS type_values;"

# Check indexes
docker exec -i postgres psql -U postgres -c "\d ads.ads" | grep -i index

# Check sample data (if any)
docker exec -i postgres psql -U postgres -c "SELECT * FROM ads.ads LIMIT 5;"
```

## Updating Existing Schema

If you have an existing `ads.ads` table that needs to be updated:

### 1. Add Missing Columns

If the table is missing the `company` or `price` columns, run:

```bash
cat services/ads-service/add-missing-columns.sql | docker exec -i postgres psql -U postgres -d ads_service
```

This will add the missing columns without affecting existing data.

### 2. Add Missing Enum Value

If the `AdStatus` enum is missing the `PUBLISHED` value, run:

```bash
cat services/ads-service/add-published-enum.sql | docker exec -i postgres psql -U postgres -d ads_service
```

This will add `PUBLISHED` to the `AdStatus` enum.

### 3. Complete Migration (All Updates - Recommended)

To apply all updates at once (adds columns and enum value):

```bash
cat services/ads-service/migrate-existing-schema.sql | docker exec -i postgres psql -U postgres -d ads_service
```

This single script will:
- Add `company` column (if missing)
- Add `price` column (if missing)
- Add `PUBLISHED` to `AdStatus` enum (if missing)
- Verify all changes

## Notes

- The SQL file is **idempotent** - it uses `IF NOT EXISTS` checks, so it's safe to run multiple times
- The schema matches the Prisma schema in `prisma/schema.prisma`
- After running the SQL file, regenerate Prisma client: `npx prisma generate`
