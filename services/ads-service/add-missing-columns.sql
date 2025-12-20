-- Add missing columns to ads.ads table
-- Run with: cat services/ads-service/add-missing-columns.sql | docker exec -i postgres psql -U postgres -d ads_service

-- Add company column if it doesn't exist
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

-- Add price column if it doesn't exist
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

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'ads' 
AND table_name = 'ads'
AND column_name IN ('company', 'price')
ORDER BY column_name;

