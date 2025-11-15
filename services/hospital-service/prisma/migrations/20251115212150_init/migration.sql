-- CreateTable
CREATE TABLE "hospitals"."hospital_specialties" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "specialtyName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospital_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitals"."hospital_services" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospital_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitals"."hospital_doctors" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CONSULTANT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospital_doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitals"."doctors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "consultationFee" INTEGER,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hospital_specialties_hospitalId_specialtyId_key" ON "hospitals"."hospital_specialties"("hospitalId", "specialtyId");

-- CreateIndex
CREATE UNIQUE INDEX "hospital_services_hospitalId_serviceId_key" ON "hospitals"."hospital_services"("hospitalId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "hospital_doctors_doctorId_hospitalId_key" ON "hospitals"."hospital_doctors"("doctorId", "hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_userId_key" ON "hospitals"."doctors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_licenseNumber_key" ON "hospitals"."doctors"("licenseNumber");

-- AddForeignKey
ALTER TABLE "hospitals"."hospital_specialties" ADD CONSTRAINT "hospital_specialties_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"."hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitals"."hospital_services" ADD CONSTRAINT "hospital_services_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"."hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitals"."hospital_doctors" ADD CONSTRAINT "hospital_doctors_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "hospitals"."doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitals"."hospital_doctors" ADD CONSTRAINT "hospital_doctors_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"."hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
