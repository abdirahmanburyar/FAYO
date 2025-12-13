# Fix ads-service schema (company column + AdStatus enum value)

Use these steps to align the ads-service database with the current Prisma schema (add `company` column and ensure `PUBLISHED` is in the `AdStatus` enum).

## One-off SQL fix (fastest)

**Note:** Your DB has enums in schema `ads` and no tables yet. The script below creates `ads` table in `public` with a `company` column, and ensures the `AdStatus` enum in schema `ads` has `PUBLISHED`.

```bash
docker exec -i postgres psql -U postgres -d ads_service << 'EOF'
-- Ensure AdStatus enum has PUBLISHED (schema: ads)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'AdStatus' AND n.nspname = 'ads') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid JOIN pg_namespace n ON n.oid = t.typnamespace
            WHERE t.typname = 'AdStatus' AND n.nspname = 'ads' AND e.enumlabel = 'PUBLISHED'
        ) THEN
            ALTER TYPE ads."AdStatus" ADD VALUE 'PUBLISHED';
            RAISE NOTICE 'Enum AdStatus: PUBLISHED added';
        ELSE
            RAISE NOTICE 'Enum AdStatus already has PUBLISHED';
        END IF;
    ELSE
        RAISE NOTICE 'Enum AdStatus not found in schema ads';
    END IF;
END $$;

-- Create ads table if it does not exist (in public), with company column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ads'
    ) THEN
        CREATE TABLE "ads" (
            id              TEXT PRIMARY KEY,
            title           TEXT,
            company         TEXT,
            image           TEXT,
            startDate       TEXT,
            endDate         TEXT,
            range           INTEGER,
            status          ads."AdStatus",
            clickCount      INTEGER DEFAULT 0,
            viewCount       INTEGER DEFAULT 0,
            createdBy       TEXT,
            createdAt       TIMESTAMP DEFAULT now(),
            updatedAt       TIMESTAMP DEFAULT now()
        );
        RAISE NOTICE 'Table ads created with company column';
    ELSE
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'ads' AND column_name = 'company'
        ) THEN
            ALTER TABLE "ads" ADD COLUMN "company" TEXT;
            RAISE NOTICE 'Column company added to existing ads table';
        ELSE
            RAISE NOTICE 'Ads table and company column already exist';
        END IF;
    END IF;
END $$;
EOF
```

## Verify
```bash
docker exec -i postgres psql -U postgres -d ads_service -c "\d ads"
docker exec -i postgres psql -U postgres -d ads_service -c "SELECT unnest(enum_range(NULL::\"AdStatus\"));"
```

## Regenerate Prisma client (ads-service)
```bash
docker compose -f docker-compose.prod.yml exec ads-service sh -c "cd /app && npx prisma generate"
```

## Restart service
```bash
docker compose -f docker-compose.prod.yml restart ads-service
```

## Migration alternative (Prisma)
If you prefer a migration instead of direct SQL:
```bash
cd /root/fayo
docker compose -f docker-compose.prod.yml exec ads-service sh -c "cd /app && npx prisma migrate dev --name add_company_and_published --create-only"
docker compose -f docker-compose.prod.yml exec ads-service sh -c "cd /app && npx prisma migrate deploy"
```

