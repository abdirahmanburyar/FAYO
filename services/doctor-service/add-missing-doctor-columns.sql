-- Add all missing columns to doctors table
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS "selfEmployedConsultationFee" INTEGER,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT,
ADD COLUMN IF NOT EXISTS awards TEXT,
ADD COLUMN IF NOT EXISTS publications TEXT,
ADD COLUMN IF NOT EXISTS memberships TEXT,
ADD COLUMN IF NOT EXISTS "researchInterests" TEXT;

