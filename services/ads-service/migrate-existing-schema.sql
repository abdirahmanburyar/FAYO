-- Complete migration script for existing ads.ads table
-- This script adds missing columns and enum values to match the Prisma schema
-- Run with: cat services/ads-service/migrate-existing-schema.sql | docker exec -i postgres psql -U postgres -d ads_service

-- Step 1: Add company column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'ads' 
        AND table_name = 'ads' 
        AND column_name = 'company'
    ) THEN
        ALTER TABLE ads.ads ADD COLUMN company TEXT NOT NULL DEFAULT 'Unknown Company';
        -- Update existing rows to have a company value
        UPDATE ads.ads SET company = COALESCE(title, 'Unknown Company') WHERE company IS NULL OR company = 'Unknown Company';
        -- Remove default after setting values
        ALTER TABLE ads.ads ALTER COLUMN company DROP DEFAULT;
        RAISE NOTICE 'Column company added to ads.ads';
    ELSE
        RAISE NOTICE 'Column company already exists in ads.ads';
    END IF;
END $$;

-- Step 2: Add price column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'ads' 
        AND table_name = 'ads' 
        AND column_name = 'price'
    ) THEN
        ALTER TABLE ads.ads ADD COLUMN price DECIMAL NOT NULL DEFAULT 0.00;
        -- Update existing rows with a default price (e.g., $1.00 per day)
        UPDATE ads.ads SET price = 1.00 WHERE price IS NULL OR price = 0.00;
        -- Remove default after setting values
        ALTER TABLE ads.ads ALTER COLUMN price DROP DEFAULT;
        RAISE NOTICE 'Column price added to ads.ads';
    ELSE
        RAISE NOTICE 'Column price already exists in ads.ads';
    END IF;
END $$;

-- Step 3: Add PUBLISHED to the AdStatus enum if it doesn't exist
DO $$
BEGIN
    -- Check if PUBLISHED already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PUBLISHED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AdStatus' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'ads'))
    ) THEN
        -- Add PUBLISHED to the enum
        ALTER TYPE ads."AdStatus" ADD VALUE 'PUBLISHED';
        RAISE NOTICE 'Value PUBLISHED added to AdStatus enum';
    ELSE
        RAISE NOTICE 'Value PUBLISHED already exists in AdStatus enum';
    END IF;
END $$;

-- Step 4: Verify the migration
SELECT 'Migration completed! Verifying changes...' AS status;

-- Verify columns
SELECT 'Columns:' AS check_type, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'ads' 
AND table_name = 'ads'
AND column_name IN ('company', 'price')
ORDER BY column_name;

-- Verify enum values
SELECT 'Enum values:' AS check_type, unnest(enum_range(NULL::ads."AdStatus")) AS status_values ORDER BY status_values;

