# Hospital Service Database Setup Guide

This guide explains how to set up the hospital-service database schema using Docker PostgreSQL.

## Quick Start

### Step 1: Create the Database

```bash
cat create-hospital-service-db.sql | docker exec -i postgres psql -U postgres
```

Or use the combined script that creates all databases:

```bash
cat create-databases-safe.sql | docker exec -i postgres psql -U postgres
```

### Step 2: Create the Schema

```bash
cat services/hospital-service/hospital-service.sql | docker exec -i postgres psql -U postgres -d hospital_service
```

## Prerequisites

1. Docker and Docker Compose installed
2. PostgreSQL container running
3. Access to the database
4. `user_service` database should exist (for userId references)
5. `specialty_service` database should exist (for specialtyId references)

## Schema Overview

The schema creates the following tables in the `hospitals` schema:

### Enums

1. **`HospitalType`** - Type of healthcare facility
   - `HOSPITAL` - Full hospital
   - `CLINIC` - Clinic

2. **`BookingPolicy`** - Booking policy for appointments
   - `HOSPITAL_ASSIGNED` - Hospital assigns doctors
   - `DIRECT_DOCTOR` - Patients book directly with doctors

### Tables

1. **`hospitals.hospitals`** - Hospital information
   - `id`, `userId` (reference to user-service), `name`, `type`
   - `address`, `city`, `phone`, `email`, `website`, `logoUrl`
   - `bookingPolicy`, `isActive`
   - Timestamps: `createdAt`, `updatedAt`

2. **`hospitals.services`** - Hospital services (e.g., Emergency, Surgery, Radiology)
   - `id`, `name`, `description`
   - `isActive`, `createdAt`, `updatedAt`

3. **`hospitals.doctors`** - Doctor information associated with hospitals
   - `id`, `userId` (reference to user-service), `specialty`, `licenseNumber`
   - `experience`, `isVerified`, `isAvailable`
   - `consultationFee`, `bio`
   - Timestamps: `createdAt`, `updatedAt`

4. **`hospitals.hospital_specialties`** - Junction table for hospital-specialty relationships
   - `id`, `hospitalId`, `specialtyId` (reference to specialty-service)
   - `isActive`, `createdAt`, `updatedAt`

5. **`hospitals.hospital_services`** - Junction table for hospital-service relationships
   - `id`, `hospitalId`, `serviceId`
   - `isActive`, `createdAt`, `updatedAt`

6. **`hospitals.hospital_doctors`** - Junction table for hospital-doctor relationships
   - `id`, `doctorId`, `hospitalId`
   - `role`, `shift`, `startTime`, `endTime`
   - `consultationFee`, `status`
   - `joinedAt`, `leftAt`, `createdAt`, `updatedAt`

### Indexes

- Unique index on `hospitals.userId`
- Unique index on `doctors.userId`
- Unique index on `doctors.licenseNumber`
- Unique constraint on `hospital_specialties(hospitalId, specialtyId)`
- Unique constraint on `hospital_services(hospitalId, serviceId)`
- Unique constraint on `hospital_doctors(doctorId, hospitalId)`

### Foreign Keys

- `hospital_specialties.hospitalId` → `hospitals.id` (CASCADE DELETE)
- `hospital_services.hospitalId` → `hospitals.id` (CASCADE DELETE)
- `hospital_services.serviceId` → `services.id` (CASCADE DELETE)
- `hospital_doctors.doctorId` → `doctors.id` (CASCADE DELETE)
- `hospital_doctors.hospitalId` → `hospitals.id` (CASCADE DELETE)

## Setup Steps

### Option 1: Direct Execution (Recommended)

Execute the SQL file directly:

```bash
# Create database
cat create-hospital-service-db.sql | docker exec -i postgres psql -U postgres

# Create schema
cat services/hospital-service/hospital-service.sql | docker exec -i postgres psql -U postgres -d hospital_service
```

### Option 2: Copy and Execute

1. **Copy the SQL file into the container:**
   ```bash
   docker cp services/hospital-service/hospital-service.sql postgres:/tmp/hospital-service.sql
   ```

2. **Execute the SQL file:**
   ```bash
   docker exec -i postgres psql -U postgres -d hospital_service -f /tmp/hospital-service.sql
   ```

## Verification

After running the SQL file, verify the schema:

```bash
# Check schema exists
docker exec -i postgres psql -U postgres -d hospital_service -c "\dn hospitals"

# Check table structures
docker exec -i postgres psql -U postgres -d hospital_service -c "\d hospitals.hospitals"
docker exec -i postgres psql -U postgres -d hospital_service -c "\d hospitals.services"
docker exec -i postgres psql -U postgres -d hospital_service -c "\d hospitals.doctors"
docker exec -i postgres psql -U postgres -d hospital_service -c "\d hospitals.hospital_specialties"
docker exec -i postgres psql -U postgres -d hospital_service -c "\d hospitals.hospital_services"
docker exec -i postgres psql -U postgres -d hospital_service -c "\d hospitals.hospital_doctors"

# Check enum values
docker exec -i postgres psql -U postgres -d hospital_service -c "SELECT unnest(enum_range(NULL::hospitals.\"HospitalType\")) AS type_values;"
docker exec -i postgres psql -U postgres -d hospital_service -c "SELECT unnest(enum_range(NULL::hospitals.\"BookingPolicy\")) AS policy_values;"

# Check indexes
docker exec -i postgres psql -U postgres -d hospital_service -c "\d hospitals.hospitals" | grep -i index

# Check foreign keys
docker exec -i postgres psql -U postgres -d hospital_service -c "\d hospitals.hospital_doctors" | grep -i foreign

# Check sample data (if any)
docker exec -i postgres psql -U postgres -d hospital_service -c "SELECT COUNT(*) FROM hospitals.hospitals;"
docker exec -i postgres psql -U postgres -d hospital_service -c "SELECT COUNT(*) FROM hospitals.doctors;"
```

## Notes

- The SQL file is **idempotent** - it uses `IF NOT EXISTS` checks, so it's safe to run multiple times
- The schema matches the Prisma schema in `prisma/schema.prisma`
- After running the SQL file, regenerate Prisma client: `npx prisma generate`
- The `userId` fields reference users in the `user_service` database (external reference)
- The `specialtyId` field references specialties in the `specialty_service` database (external reference)
- The `hospitals` schema is used (not `public`) to match the Prisma multi-schema configuration

## Using Prisma Migrations (Alternative)

If you prefer to use Prisma migrations instead of SQL files:

```bash
# Generate Prisma client
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma generate"

# Run migrations
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma migrate deploy"
```

