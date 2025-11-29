-- Create payments schema
CREATE SCHEMA IF NOT EXISTS payments;

-- Create PaymentMethod enum
DO $$ BEGIN
    CREATE TYPE payments."PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHEQUE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create PaymentStatus enum
DO $$ BEGIN
    CREATE TYPE payments."PaymentStatus" AS ENUM ('PAID', 'REFUNDED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments.payments (
    id TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" payments."PaymentMethod" NOT NULL,
    "paymentStatus" payments."PaymentStatus" NOT NULL DEFAULT 'PAID',
    "transactionId" TEXT,
    "receiptNumber" TEXT,
    "paidBy" TEXT,
    "processedBy" TEXT,
    notes TEXT,
    "paymentDate" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "refundReason" TEXT,
    "refundedBy" TEXT,
    metadata JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY (id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "payments_appointmentId_idx" ON payments.payments("appointmentId");
CREATE INDEX IF NOT EXISTS "payments_paymentStatus_idx" ON payments.payments("paymentStatus");
CREATE INDEX IF NOT EXISTS "payments_paymentMethod_idx" ON payments.payments("paymentMethod");
CREATE INDEX IF NOT EXISTS "payments_transactionId_idx" ON payments.payments("transactionId");
CREATE INDEX IF NOT EXISTS "payments_receiptNumber_idx" ON payments.payments("receiptNumber");
CREATE INDEX IF NOT EXISTS "payments_paidBy_idx" ON payments.payments("paidBy");
CREATE INDEX IF NOT EXISTS "payments_processedBy_idx" ON payments.payments("processedBy");
CREATE INDEX IF NOT EXISTS "payments_paymentDate_idx" ON payments.payments("paymentDate");

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "payments_transactionId_key" ON payments.payments("transactionId") WHERE "transactionId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "payments_receiptNumber_key" ON payments.payments("receiptNumber") WHERE "receiptNumber" IS NOT NULL;

