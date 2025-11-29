-- Create appointments schema
CREATE SCHEMA IF NOT EXISTS appointments;

-- Create AppointmentStatus enum
DO $$ BEGIN
    CREATE TYPE appointments."AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ConsultationType enum
DO $$ BEGIN
    CREATE TYPE appointments."ConsultationType" AS ENUM ('IN_PERSON', 'VIDEO', 'PHONE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create PaymentStatus enum
DO $$ BEGIN
    CREATE TYPE appointments."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments.appointments (
    id TEXT NOT NULL,
    "appointmentNumber" INTEGER,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "hospitalId" TEXT,
    "specialtyId" TEXT,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "appointmentTime" TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30,
    status appointments."AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "consultationType" appointments."ConsultationType" NOT NULL DEFAULT 'IN_PERSON',
    reason TEXT,
    description TEXT,
    "consultationFee" INTEGER NOT NULL,
    "paymentStatus" appointments."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paymentTransactionId" TEXT,
    "createdBy" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    "completedAt" TIMESTAMP(3),
    notes TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY (id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "appointments_patientId_idx" ON appointments.appointments("patientId");
CREATE INDEX IF NOT EXISTS "appointments_doctorId_idx" ON appointments.appointments("doctorId");
CREATE INDEX IF NOT EXISTS "appointments_hospitalId_idx" ON appointments.appointments("hospitalId");
CREATE INDEX IF NOT EXISTS "appointments_appointmentDate_idx" ON appointments.appointments("appointmentDate");
CREATE INDEX IF NOT EXISTS "appointments_status_idx" ON appointments.appointments(status);
CREATE INDEX IF NOT EXISTS "appointments_paymentStatus_idx" ON appointments.appointments("paymentStatus");
CREATE INDEX IF NOT EXISTS "appointments_appointmentNumber_idx" ON appointments.appointments("appointmentNumber");

-- Create unique constraint for appointmentNumber
CREATE UNIQUE INDEX IF NOT EXISTS "appointments_appointmentNumber_key" ON appointments.appointments("appointmentNumber") WHERE "appointmentNumber" IS NOT NULL;

