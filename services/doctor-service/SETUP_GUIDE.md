# Doctor Service Database Setup Guide

This guide explains how to set up the doctor-service database schema using Docker PostgreSQL.

## Quick Start

### Step 1: Create the Database

```bash
cat create-doctor-service-db.sql | docker exec -i postgres psql -U postgres
```

Or use the combined script that creates all databases:

```bash
cat create-databases-safe.sql | docker exec -i postgres psql -U postgres
```

### Step 2: Create the Schema

```bash
cat services/doctor-service/doctor-service.sql | docker exec -i postgres psql -U postgres -d doctor_service
```

## Prerequisites

1. Docker and Docker Compose installed
2. PostgreSQL container running
3. Access to the database
4. `user_service` database should exist (for userId references)

## Schema Overview

The schema creates the following tables in the `public` schema:

### Tables

1. **`doctors`** - Doctor profiles and professional information
   - `id`, `userId` (reference to user-service), `licenseNumber`
   - `experience`, `isVerified`, `isAvailable`
   - `selfEmployedConsultationFee`, `bio`, `imageUrl`
   - Professional info: `education`, `certifications`, `languages`, `awards`, `publications`, `memberships`, `researchInterests`
   - Timestamps: `createdAt`, `updatedAt`

2. **`hospitals`** - Hospital information
   - `id`, `name`, `type`, `address`, `city`
   - `phone`, `email`, `website`
   - `isActive`, `createdAt`, `updatedAt`

3. **`hospital_doctors`** - Junction table for doctor-hospital relationships
   - `id`, `doctorId`, `hospitalId`
   - `isActive`, `joinedAt`, `leftAt`
   - Working schedule: `workingDays`, `startTime`, `endTime`
   - `consultationFee` (hospital-specific)
   - Timestamps: `createdAt`, `updatedAt`

4. **`doctor_specialties`** - Junction table for doctor-specialty relationships
   - `id`, `doctorId`, `specialtyId` (reference to specialty-service)
   - `isActive`, `createdAt`, `updatedAt`

### Indexes

- Unique index on `doctors.userId`
- Unique index on `doctors.licenseNumber`
- Unique constraint on `hospital_doctors(doctorId, hospitalId)`
- Unique constraint on `doctor_specialties(doctorId, specialtyId)`

### Foreign Keys

- `hospital_doctors.doctorId` → `doctors.id` (CASCADE DELETE)
- `hospital_doctors.hospitalId` → `hospitals.id` (CASCADE DELETE)
- `doctor_specialties.doctorId` → `doctors.id` (CASCADE DELETE)

## Setup Steps

### Option 1: Direct Execution (Recommended)

Execute the SQL file directly:

```bash
# Create database
cat create-doctor-service-db.sql | docker exec -i postgres psql -U postgres

# Create schema
cat services/doctor-service/doctor-service.sql | docker exec -i postgres psql -U postgres -d doctor_service
```

### Option 2: Copy and Execute

1. **Copy the SQL file into the container:**
   ```bash
   docker cp services/doctor-service/doctor-service.sql postgres:/tmp/doctor-service.sql
   ```

2. **Execute the SQL file:**
   ```bash
   docker exec -i postgres psql -U postgres -d doctor_service -f /tmp/doctor-service.sql
   ```

## Verification

After running the SQL file, verify the schema:

```bash
# Check table structures
docker exec -i postgres psql -U postgres -d doctor_service -c "\d doctors"
docker exec -i postgres psql -U postgres -d doctor_service -c "\d hospitals"
docker exec -i postgres psql -U postgres -d doctor_service -c "\d hospital_doctors"
docker exec -i postgres psql -U postgres -d doctor_service -c "\d doctor_specialties"

# Check indexes
docker exec -i postgres psql -U postgres -d doctor_service -c "\d doctors" | grep -i index
docker exec -i postgres psql -U postgres -d doctor_service -c "\d hospital_doctors" | grep -i index

# Check foreign keys
docker exec -i postgres psql -U postgres -d doctor_service -c "\d hospital_doctors" | grep -i foreign

# Check sample data (if any)
docker exec -i postgres psql -U postgres -d doctor_service -c "SELECT COUNT(*) FROM doctors;"
docker exec -i postgres psql -U postgres -d doctor_service -c "SELECT COUNT(*) FROM hospitals;"
```

## Notes

- The SQL file is **idempotent** - it uses `IF NOT EXISTS` checks, so it's safe to run multiple times
- The schema matches the Prisma schema in `prisma/schema.prisma`
- After running the SQL file, regenerate Prisma client: `npx prisma generate`
- The `userId` field references users in the `user_service` database (external reference)
- The `specialtyId` field references specialties in the `specialty_service` database (external reference)
- JSON fields (`certifications`, `languages`, `awards`, `publications`, `memberships`, `workingDays`) are stored as TEXT and should be parsed as JSON in the application

## Using Prisma Migrations (Alternative)

If you prefer to use Prisma migrations instead of SQL files:

```bash
# Generate Prisma client
docker compose -f docker-compose.prod.yml exec doctor-service sh -c "cd /app && npx prisma generate"

# Run migrations
docker compose -f docker-compose.prod.yml exec doctor-service sh -c "cd /app && npx prisma migrate deploy"
```

## Updating Existing Schema

If you have an existing schema that's missing columns, check the migration files:
- `add-missing-doctor-columns.sql` - Adds missing columns to doctors table
- `add-self-employed-fee-column.sql` - Adds self-employed consultation fee column

