-- Add selfEmployedConsultationFee column to doctors table
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS "selfEmployedConsultationFee" INTEGER;

