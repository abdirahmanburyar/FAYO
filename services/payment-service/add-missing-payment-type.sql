-- Add missing paymentType column and related fields to payments table
-- Run with: cat services/payment-service/add-missing-payment-type.sql | docker exec -i postgres psql -U postgres -d payment_service

-- Step 1: Create PaymentType enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE payments."PaymentType" AS ENUM ('APPOINTMENT', 'AD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add paymentType column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'payments' 
        AND table_name = 'payments' 
        AND column_name = 'paymentType'
    ) THEN
        ALTER TABLE payments.payments 
        ADD COLUMN "paymentType" payments."PaymentType" NOT NULL DEFAULT 'APPOINTMENT';
        RAISE NOTICE 'Column paymentType added to payments.payments';
    ELSE
        RAISE NOTICE 'Column paymentType already exists in payments.payments';
    END IF;
END $$;

-- Step 3: Make appointmentId nullable if it's not already
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'payments' 
        AND table_name = 'payments' 
        AND column_name = 'appointmentId'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE payments.payments ALTER COLUMN "appointmentId" DROP NOT NULL;
        RAISE NOTICE 'Column appointmentId made nullable';
    ELSE
        RAISE NOTICE 'Column appointmentId is already nullable or does not exist';
    END IF;
END $$;

-- Step 4: Add adId column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'payments' 
        AND table_name = 'payments' 
        AND column_name = 'adId'
    ) THEN
        ALTER TABLE payments.payments ADD COLUMN "adId" TEXT;
        RAISE NOTICE 'Column adId added to payments.payments';
    ELSE
        RAISE NOTICE 'Column adId already exists in payments.payments';
    END IF;
END $$;

-- Step 5: Add index for adId if it doesn't exist
CREATE INDEX IF NOT EXISTS "payments_adId_idx" ON payments.payments("adId");

-- Step 6: Add index for paymentType if it doesn't exist
CREATE INDEX IF NOT EXISTS "payments_paymentType_idx" ON payments.payments("paymentType");

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'payments' 
AND table_name = 'payments'
AND column_name IN ('paymentType', 'adId')
ORDER BY column_name;

