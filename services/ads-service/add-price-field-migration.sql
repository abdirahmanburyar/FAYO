-- Migration: Add price field to ads table
-- This migration adds a price field (price per day in cents) to support the new pricing model
--
-- To run this migration through Docker:
--   cat services/ads-service/add-price-field-migration.sql | docker exec -i postgres psql -U postgres -d ads_service
--
-- Or copy and execute:
--   docker cp services/ads-service/add-price-field-migration.sql postgres:/tmp/migration.sql
--   docker exec -i postgres psql -U postgres -d ads_service -f /tmp/migration.sql

-- Step 1: Add price column (price per day in cents)
ALTER TABLE ads.ads
ADD COLUMN IF NOT EXISTS "price" INTEGER NOT NULL DEFAULT 100;

-- Step 2: Update existing ads with a default price if needed
-- This sets a default price of $1.00/day (100 cents) for existing ads
UPDATE ads.ads
SET "price" = 100
WHERE "price" IS NULL OR "price" = 0;

-- Step 3: Add a check constraint to ensure price is positive
ALTER TABLE ads.ads
ADD CONSTRAINT "ads_price_positive_check"
CHECK ("price" > 0);

