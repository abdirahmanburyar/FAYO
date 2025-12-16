-- Migration: Add support for ad payments
-- This migration adds paymentType enum and adId field to support ad payments

-- Step 1: Create PaymentType enum
DO $$ BEGIN
    CREATE TYPE payments."PaymentType" AS ENUM ('APPOINTMENT', 'AD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add paymentType column with default value
ALTER TABLE payments.payments 
ADD COLUMN IF NOT EXISTS "paymentType" payments."PaymentType" NOT NULL DEFAULT 'APPOINTMENT';

-- Step 3: Make appointmentId nullable (since ads won't have appointmentId)
ALTER TABLE payments.payments 
ALTER COLUMN "appointmentId" DROP NOT NULL;

-- Step 4: Add adId column
ALTER TABLE payments.payments 
ADD COLUMN IF NOT EXISTS "adId" TEXT;

-- Step 5: Add index for adId
CREATE INDEX IF NOT EXISTS "payments_adId_idx" ON payments.payments("adId");

-- Step 6: Add index for paymentType
CREATE INDEX IF NOT EXISTS "payments_paymentType_idx" ON payments.payments("paymentType");

-- Step 7: Add constraint to ensure either appointmentId or adId is provided
-- Note: This is a check constraint that ensures at least one is not null
ALTER TABLE payments.payments
ADD CONSTRAINT "payments_appointment_or_ad_check" 
CHECK (
  ("paymentType" = 'APPOINTMENT' AND "appointmentId" IS NOT NULL) OR
  ("paymentType" = 'AD' AND "adId" IS NOT NULL)
);

