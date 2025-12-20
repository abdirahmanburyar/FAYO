-- Add PUBLISHED value to AdStatus enum
-- Run with: cat services/ads-service/add-published-enum.sql | docker exec -i postgres psql -U postgres -d ads_service

-- Add PUBLISHED to the AdStatus enum if it doesn't exist
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

-- Verify the enum values
SELECT unnest(enum_range(NULL::ads."AdStatus")) AS status_values ORDER BY status_values;

