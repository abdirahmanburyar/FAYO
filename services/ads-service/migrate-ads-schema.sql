-- Migration script to update ads-service database schema
-- This script migrates from the old schema to the new simplified schema
-- Run this script on your PostgreSQL database

BEGIN;

-- Step 1: Add new columns (if they don't exist)
DO $$ 
BEGIN
    -- Add company column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'ads' AND table_name = 'ads' AND column_name = 'company') THEN
        ALTER TABLE ads.ads ADD COLUMN company TEXT;
    END IF;
    
    -- Add range column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'ads' AND table_name = 'ads' AND column_name = 'range') THEN
        ALTER TABLE ads.ads ADD COLUMN range INTEGER;
    END IF;
    
    -- Rename imageUrl to image if imageUrl exists and image doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'ads' AND table_name = 'ads' AND column_name = 'imageUrl')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'ads' AND table_name = 'ads' AND column_name = 'image') THEN
        ALTER TABLE ads.ads RENAME COLUMN "imageUrl" TO image;
    END IF;
    
    -- Rename days to range if days exists and range doesn't have data
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'ads' AND table_name = 'ads' AND column_name = 'days')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'ads' AND table_name = 'ads' AND column_name = 'range') THEN
        ALTER TABLE ads.ads RENAME COLUMN days TO range;
    END IF;
END $$;

-- Step 2: Migrate existing data
-- Set company from title (or default value)
UPDATE ads.ads 
SET company = COALESCE(title, 'Unknown Company')
WHERE company IS NULL;

-- Calculate range from existing days or from startDate/endDate
UPDATE ads.ads 
SET range = CASE 
    WHEN range IS NULL AND EXISTS (SELECT 1 FROM information_schema.columns 
                                    WHERE table_schema = 'ads' AND table_name = 'ads' AND column_name = 'days') THEN
        (SELECT days FROM ads.ads WHERE ads.ads.id = ads.ads.id)
    WHEN range IS NULL THEN
        GREATEST(1, EXTRACT(DAY FROM (endDate - startDate))::INTEGER)
    ELSE range
END
WHERE range IS NULL;

-- Set default range if still null
UPDATE ads.ads SET range = 1 WHERE range IS NULL;

-- Step 3: Create new AdStatus enum with only INACTIVE and PUBLISHED
DO $$ 
BEGIN
    -- Create new enum type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdStatus_new' AND typnamespace = 
                   (SELECT oid FROM pg_namespace WHERE nspname = 'ads')) THEN
        CREATE TYPE ads."AdStatus_new" AS ENUM ('INACTIVE', 'PUBLISHED');
    END IF;
    
    -- Add temporary column with new enum
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'ads' AND table_name = 'ads' AND column_name = 'status_new') THEN
        ALTER TABLE ads.ads ADD COLUMN status_new ads."AdStatus_new";
    END IF;
    
    -- Migrate status values
    -- ACTIVE -> PUBLISHED
    -- PENDING -> INACTIVE (or PUBLISHED if within date range)
    -- EXPIRED -> INACTIVE
    -- INACTIVE -> INACTIVE
    UPDATE ads.ads 
    SET status_new = CASE 
        WHEN status::text = 'ACTIVE' THEN 'PUBLISHED'::ads."AdStatus_new"
        WHEN status::text = 'PENDING' AND startDate <= NOW() AND endDate >= NOW() THEN 'PUBLISHED'::ads."AdStatus_new"
        WHEN status::text = 'PENDING' THEN 'INACTIVE'::ads."AdStatus_new"
        WHEN status::text = 'EXPIRED' THEN 'INACTIVE'::ads."AdStatus_new"
        WHEN status::text = 'INACTIVE' THEN 'INACTIVE'::ads."AdStatus_new"
        ELSE 'INACTIVE'::ads."AdStatus_new"
    END;
    
    -- Set default for any null values
    UPDATE ads.ads SET status_new = 'INACTIVE'::ads."AdStatus_new" WHERE status_new IS NULL;
    
    -- Drop old status column
    ALTER TABLE ads.ads DROP COLUMN status;
    
    -- Rename new column to status
    ALTER TABLE ads.ads RENAME COLUMN status_new TO status;
    
    -- Set NOT NULL constraint
    ALTER TABLE ads.ads ALTER COLUMN status SET NOT NULL;
    ALTER TABLE ads.ads ALTER COLUMN status SET DEFAULT 'INACTIVE'::ads."AdStatus_new";
    
    -- Drop old enum type (only if no other tables use it)
    DROP TYPE IF EXISTS ads."AdStatus";
    
    -- Rename new enum to AdStatus
    ALTER TYPE ads."AdStatus_new" RENAME TO "AdStatus";
END $$;

-- Step 4: Remove old columns
DO $$ 
BEGIN
    -- Drop title column
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'ads' AND table_name = 'ads' AND column_name = 'title') THEN
        ALTER TABLE ads.ads DROP COLUMN title;
    END IF;
    
    -- Drop description column
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'ads' AND table_name = 'ads' AND column_name = 'description') THEN
        ALTER TABLE ads.ads DROP COLUMN description;
    END IF;
    
    -- Drop linkUrl column
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'ads' AND table_name = 'ads' AND column_name = 'linkUrl') THEN
        ALTER TABLE ads.ads DROP COLUMN "linkUrl";
    END IF;
    
    -- Drop type column
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'ads' AND table_name = 'ads' AND column_name = 'type') THEN
        ALTER TABLE ads.ads DROP COLUMN type;
    END IF;
    
    -- Drop priority column
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'ads' AND table_name = 'ads' AND column_name = 'priority') THEN
        ALTER TABLE ads.ads DROP COLUMN priority;
    END IF;
    
    -- Drop days column if it still exists (after rename)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'ads' AND table_name = 'ads' AND column_name = 'days') THEN
        ALTER TABLE ads.ads DROP COLUMN days;
    END IF;
END $$;

-- Step 5: Set NOT NULL constraints on new required columns
DO $$ 
BEGIN
    -- Make company NOT NULL
    ALTER TABLE ads.ads ALTER COLUMN company SET NOT NULL;
    
    -- Make image NOT NULL (should already be, but ensure it)
    ALTER TABLE ads.ads ALTER COLUMN image SET NOT NULL;
    
    -- Make range NOT NULL with default
    ALTER TABLE ads.ads ALTER COLUMN range SET NOT NULL;
    ALTER TABLE ads.ads ALTER COLUMN range SET DEFAULT 1;
END $$;

-- Step 6: Drop old indexes that reference removed columns
DROP INDEX IF EXISTS ads.idx_ads_priority_status;

-- Step 7: Recreate index on status, startDate, endDate (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_ads_status_dates ON ads.ads(status, "startDate", "endDate");

-- Step 8: Drop AdType enum if it exists (no longer needed)
DROP TYPE IF EXISTS ads."AdType";

COMMIT;

-- Verification queries (run these to check the migration)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'ads' AND table_name = 'ads' 
-- ORDER BY ordinal_position;

-- SELECT unnest(enum_range(NULL::ads."AdStatus")) AS status_values;

