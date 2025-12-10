# Ads Service Database Migration Guide

This guide explains how to migrate the ads-service database schema using Docker PostgreSQL.

## Quick Start

**To run the migration, use this single command:**

```bash
cat services/ads-service/migrate-ads-schema.sql | docker exec -i postgres psql -U postgres -d ads_service
```

**To backup before migration:**

```bash
docker exec postgres pg_dump -U postgres -d ads_service > backup_ads_service_$(date +%Y%m%d_%H%M%S).sql
```

## Migration Overview

The migration updates the ads schema to:
- Add `company` field (company/person name)
- Rename `imageUrl` to `image`
- Rename `days` to `range`
- Update `AdStatus` enum from `ACTIVE/INACTIVE/PENDING/EXPIRED` to `INACTIVE/PUBLISHED`
- Remove: `title`, `description`, `linkUrl`, `type`, `priority`

## Prerequisites

1. Docker and Docker Compose installed
2. PostgreSQL container running
3. Access to the database

## Migration Steps

### Option 1: Direct Execution (Recommended)

Execute the migration directly using the standard format:

```bash
cat services/ads-service/migrate-ads-schema.sql | docker exec -i postgres psql -U postgres -d ads_service
```

### Option 2: Copy and Execute

1. **Copy the migration script into the container:**
   ```bash
   docker cp services/ads-service/migrate-ads-schema.sql postgres:/tmp/migrate-ads-schema.sql
   ```

2. **Execute the migration:**
   ```bash
   cat /tmp/migrate-ads-schema.sql | docker exec -i postgres psql -U postgres -d ads_service
   ```

   Or using -f flag:
   ```bash
   docker exec -i postgres psql -U postgres -d ads_service -f /tmp/migrate-ads-schema.sql
   ```

## Quick Migration Command

**From the project root directory, run:**

```bash
cat services/ads-service/migrate-ads-schema.sql | docker exec -i postgres psql -U postgres -d ads_service
```

That's it! The migration will run and update your database schema.

## Verification

After running the migration, verify the changes using the same format:

```bash
# Check table structure
docker exec -i postgres psql -U postgres -d ads_service -c "\d ads.ads"

# Check enum values (should show INACTIVE and PUBLISHED only)
docker exec -i postgres psql -U postgres -d ads_service -c "SELECT unnest(enum_range(NULL::ads.\"AdStatus\")) AS status_values;"

# Check sample data
docker exec -i postgres psql -U postgres -d ads_service -c "SELECT id, company, image, range, status FROM ads.ads LIMIT 5;"

# Check column names (should NOT have: title, description, linkUrl, type, priority, days, imageUrl)
docker exec -i postgres psql -U postgres -d ads_service -c "SELECT column_name FROM information_schema.columns WHERE table_schema = 'ads' AND table_name = 'ads' ORDER BY ordinal_position;"
```

## Backup Before Migration (IMPORTANT!)

**Always backup your database before running migrations:**

```bash
# Backup the ads_service database
docker exec postgres pg_dump -U postgres -d ads_service > backup_ads_service_$(date +%Y%m%d_%H%M%S).sql

# Or backup just the ads schema
docker exec postgres pg_dump -U postgres -d ads_service -n ads > backup_ads_schema_$(date +%Y%m%d_%H%M%S).sql
```

## Rollback (If Needed)

If you need to rollback, restore from the backup using the same format:

```bash
# Restore from backup
cat backup_ads_service_YYYYMMDD_HHMMSS.sql | docker exec -i postgres psql -U postgres -d ads_service
```

## Troubleshooting

### Error: "relation does not exist"
- Make sure the `ads` schema exists
- Check that you're connected to the correct database

### Error: "column already exists"
- The migration script checks for existing columns, but if you see this, the column may already be migrated
- Check the current schema: `\d ads.ads`

### Error: "enum type does not exist"
- The old enum may have been dropped
- Check existing enums: `SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'ads');`

## Notes

- The migration is **idempotent** - it checks for existing columns/constraints before making changes
- Existing data is preserved and migrated:
  - `title` → `company` (or "Unknown Company" if title was null)
  - `days` → `range` (or calculated from startDate/endDate)
  - Status values are converted: `ACTIVE` → `PUBLISHED`, others → `INACTIVE`
- The migration runs in a transaction (BEGIN/COMMIT), so it's safe to rollback if it fails

