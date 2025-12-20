-- Payment Service Database Schema
-- This file creates the complete database schema for the payment-service
-- Run with: cat services/payment-service/payment-service.sql | docker exec -i postgres psql -U postgres -d payment_service

-- Create payments schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS payments;

-- Create PaymentMethod enum
DO $$ BEGIN
    CREATE TYPE payments."PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHEQUE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create PaymentType enum
DO $$ BEGIN
    CREATE TYPE payments."PaymentType" AS ENUM ('APPOINTMENT', 'AD');
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
    "paymentType" payments."PaymentType" NOT NULL DEFAULT 'APPOINTMENT',
    "appointmentId" TEXT,
    "adId" TEXT,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY (id)
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "payments_transactionId_key" ON payments.payments("transactionId") WHERE "transactionId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "payments_receiptNumber_key" ON payments.payments("receiptNumber") WHERE "receiptNumber" IS NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "payments_appointmentId_idx" ON payments.payments("appointmentId");
CREATE INDEX IF NOT EXISTS "payments_adId_idx" ON payments.payments("adId");
CREATE INDEX IF NOT EXISTS "payments_paymentType_idx" ON payments.payments("paymentType");
CREATE INDEX IF NOT EXISTS "payments_paymentStatus_idx" ON payments.payments("paymentStatus");
CREATE INDEX IF NOT EXISTS "payments_paymentMethod_idx" ON payments.payments("paymentMethod");
CREATE INDEX IF NOT EXISTS "payments_transactionId_idx" ON payments.payments("transactionId");
CREATE INDEX IF NOT EXISTS "payments_receiptNumber_idx" ON payments.payments("receiptNumber");
CREATE INDEX IF NOT EXISTS "payments_paidBy_idx" ON payments.payments("paidBy");
CREATE INDEX IF NOT EXISTS "payments_processedBy_idx" ON payments.payments("processedBy");
CREATE INDEX IF NOT EXISTS "payments_paymentDate_idx" ON payments.payments("paymentDate");

-- Add comments for documentation
COMMENT ON SCHEMA payments IS 'Schema for payment management';
COMMENT ON TABLE payments.payments IS 'Stores payment information for appointments and ads';
COMMENT ON COLUMN payments.payments."paymentType" IS 'Type of payment: APPOINTMENT or AD';
COMMENT ON COLUMN payments.payments."appointmentId" IS 'Reference to appointment ID in appointment-service (for appointment payments)';
COMMENT ON COLUMN payments.payments."adId" IS 'Reference to ad ID in ads-service (for ad payments)';
COMMENT ON COLUMN payments.payments.amount IS 'Payment amount in cents';
COMMENT ON COLUMN payments.payments."transactionId" IS 'External transaction ID from payment gateway';
COMMENT ON COLUMN payments.payments."receiptNumber" IS 'Internal receipt number for tracking';
COMMENT ON COLUMN payments.payments."paidBy" IS 'User ID who made the payment';
COMMENT ON COLUMN payments.payments."processedBy" IS 'Admin/staff ID who processed the payment';
COMMENT ON COLUMN payments.payments.metadata IS 'Additional payment metadata in JSON format';

