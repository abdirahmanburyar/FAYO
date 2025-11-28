# Fix Doctor Service - Add All Missing Columns

## Problem

The `doctor-service` Prisma schema has several columns that don't exist in the database:
- `selfEmployedConsultationFee`
- `education`
- `certifications`
- `languages`
- `awards`
- `publications`
- `memberships`
- `researchInterests`

## Solution

Add all missing columns to the database at once.

## Quick Fix (Run on VPS)

```bash
cd /root/fayo

# Add all missing columns
docker exec -i postgres psql -U postgres -d doctor_service << 'EOF'
-- Add all missing columns from the schema
DO $$ 
BEGIN
    -- Add selfEmployedConsultationFee
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'doctors' AND column_name = 'selfEmployedConsultationFee'
    ) THEN
        ALTER TABLE "doctors" ADD COLUMN "selfEmployedConsultationFee" INTEGER;
    END IF;

    -- Add education
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'doctors' AND column_name = 'education'
    ) THEN
        ALTER TABLE "doctors" ADD COLUMN "education" TEXT;
    END IF;

    -- Add certifications
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'doctors' AND column_name = 'certifications'
    ) THEN
        ALTER TABLE "doctors" ADD COLUMN "certifications" TEXT;
    END IF;

    -- Add languages
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'doctors' AND column_name = 'languages'
    ) THEN
        ALTER TABLE "doctors" ADD COLUMN "languages" TEXT;
    END IF;

    -- Add awards
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'doctors' AND column_name = 'awards'
    ) THEN
        ALTER TABLE "doctors" ADD COLUMN "awards" TEXT;
    END IF;

    -- Add publications
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'doctors' AND column_name = 'publications'
    ) THEN
        ALTER TABLE "doctors" ADD COLUMN "publications" TEXT;
    END IF;

    -- Add memberships
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'doctors' AND column_name = 'memberships'
    ) THEN
        ALTER TABLE "doctors" ADD COLUMN "memberships" TEXT;
    END IF;

    -- Add researchInterests
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'doctors' AND column_name = 'researchInterests'
    ) THEN
        ALTER TABLE "doctors" ADD COLUMN "researchInterests" TEXT;
    END IF;

    RAISE NOTICE 'All missing columns added successfully';
END $$;
EOF

# Verify columns were added
docker exec -i postgres psql -U postgres -d doctor_service -c "\d doctors"

# Regenerate Prisma Client
docker compose -f docker-compose.prod.yml exec doctor-service sh -c "cd /app && npx prisma generate"

# Restart the service
docker compose -f docker-compose.prod.yml restart doctor-service
```

