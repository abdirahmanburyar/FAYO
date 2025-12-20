# Appointment Service Database Setup Guide

This guide explains how to set up the appointment-service database schema using Docker PostgreSQL.

## Quick Start

### Step 1: Create the Database

```bash
cat create-appointment-service-db.sql | docker exec -i postgres psql -U postgres
```

Or use a direct command:
```bash
docker exec -i postgres psql -U postgres -c "CREATE DATABASE appointment_service;" 2>/dev/null || echo "Database may already exist"
```

Or use the combined script that creates all databases:
```bash
# Use shell commands to create all databases
docker exec -i postgres psql -U postgres <<EOF
CREATE DATABASE IF NOT EXISTS fayo;
CREATE DATABASE IF NOT EXISTS user_service;
CREATE DATABASE IF NOT EXISTS hospital_service;
CREATE DATABASE IF NOT EXISTS doctor_service;
CREATE DATABASE IF NOT EXISTS specialty_service;
CREATE DATABASE IF NOT EXISTS appointment_service;
CREATE DATABASE IF NOT EXISTS ads_service;
CREATE DATABASE IF NOT EXISTS payment_service;
EOF
```

### Step 2: Create the Schema

```bash
cat services/appointment-service/appointment-service.sql | docker exec -i postgres psql -U postgres -d appointment_service
```

## Prerequisites

1. Docker and Docker Compose installed
2. PostgreSQL container running
3. Access to the database
4. Other service databases should exist (for references):
   - `user_service` (for patientId, createdBy)
   - `doctor_service` or `hospital_service` (for doctorId)
   - `hospital_service` (for hospitalId)
   - `specialty_service` (for specialtyId)
   - `payment_service` (for paymentTransactionId)

## Schema Overview

The schema creates the following in the `appointments` schema:

### Enums

1. **`AppointmentStatus`** - Status of the appointment
   - `PENDING` - Appointment is pending confirmation
   - `CONFIRMED` - Appointment is confirmed
   - `COMPLETED` - Appointment has been completed
   - `CANCELLED` - Appointment was cancelled
   - `NO_SHOW` - Patient did not show up
   - `RESCHEDULED` - Appointment was rescheduled

2. **`ConsultationType`** - Type of consultation
   - `IN_PERSON` - In-person consultation
   - `VIDEO` - Video call consultation
   - `PHONE` - Phone call consultation

3. **`PaymentStatus`** - Payment status
   - `PENDING` - Payment is pending
   - `PAID` - Payment has been completed
   - `REFUNDED` - Payment has been refunded

### Tables

**`appointments.appointments`** - Appointment information and booking details
- `id` - Primary key (TEXT, CUID format)
- `appointmentNumber` - Unique appointment number for tracking (optional, unique)
- `patientId` - Reference to patient user ID in user-service
- `doctorId` - Reference to doctor ID (optional)
- `hospitalId` - Reference to hospital ID (optional)
- `specialtyId` - Reference to specialty ID (optional)
- `appointmentDate` - Date of the appointment
- `appointmentTime` - Time of the appointment (TEXT format, e.g., "09:00")
- `duration` - Appointment duration in minutes (default: 30)
- `status` - Appointment status (default: PENDING)
- `consultationType` - Type of consultation (default: IN_PERSON)
- `reason` - Reason for the appointment (optional)
- `description` - Additional description (optional)
- `consultationFee` - Consultation fee in cents
- `paymentStatus` - Payment status (default: PENDING)
- `paymentMethod` - Payment method used (optional)
- `paymentTransactionId` - Reference to payment transaction ID (optional)
- `createdBy` - User ID who created the appointment
- `cancelledAt` - Timestamp when appointment was cancelled (optional)
- `cancelledBy` - User ID who cancelled the appointment (optional)
- `cancellationReason` - Reason for cancellation (optional)
- `completedAt` - Timestamp when appointment was completed (optional)
- `notes` - Additional notes (optional)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Indexes

- Unique index on `appointmentNumber` (where not null)
- Index on `patientId` for quick patient lookup
- Index on `doctorId` for quick doctor lookup
- Index on `hospitalId` for quick hospital lookup
- Index on `appointmentDate` for date-based queries
- Index on `status` for status-based filtering
- Index on `paymentStatus` for payment queries
- Index on `appointmentNumber` for appointment number lookup

## Setup Steps

### Option 1: Direct Execution (Recommended)

Execute the SQL file directly:

```bash
# Create database
cat create-appointment-service-db.sql | docker exec -i postgres psql -U postgres

# Create schema
cat services/appointment-service/appointment-service.sql | docker exec -i postgres psql -U postgres -d appointment_service
```

### Option 2: Copy and Execute

1. **Copy the SQL file into the container:**
   ```bash
   docker cp services/appointment-service/appointment-service.sql postgres:/tmp/appointment-service.sql
   ```

2. **Execute the SQL file:**
   ```bash
   docker exec -i postgres psql -U postgres -d appointment_service -f /tmp/appointment-service.sql
   ```

## Verification

After running the SQL file, verify the schema:

```bash
# Check schema exists
docker exec -i postgres psql -U postgres -d appointment_service -c "\dn appointments"

# Check table structure
docker exec -i postgres psql -U postgres -d appointment_service -c "\d appointments.appointments"

# Check enum values
docker exec -i postgres psql -U postgres -d appointment_service -c "SELECT unnest(enum_range(NULL::appointments.\"AppointmentStatus\")) AS status_values;"
docker exec -i postgres psql -U postgres -d appointment_service -c "SELECT unnest(enum_range(NULL::appointments.\"ConsultationType\")) AS type_values;"
docker exec -i postgres psql -U postgres -d appointment_service -c "SELECT unnest(enum_range(NULL::appointments.\"PaymentStatus\")) AS payment_values;"

# Check indexes
docker exec -i postgres psql -U postgres -d appointment_service -c "\d appointments.appointments" | grep -i index

# Check sample data (if any)
docker exec -i postgres psql -U postgres -d appointment_service -c "SELECT COUNT(*) FROM appointments.appointments;"
```

## Notes

- The SQL file is **idempotent** - it uses `IF NOT EXISTS` checks, so it's safe to run multiple times
- The schema matches the Prisma schema in `prisma/schema.prisma`
- After running the SQL file, regenerate Prisma client: `npx prisma generate`
- The `patientId`, `doctorId`, `hospitalId`, and `specialtyId` fields reference external services
- The `paymentTransactionId` field references payment transactions in the payment-service
- The `appointmentNumber` is optional and can be auto-generated by the application
- All timestamps use `TIMESTAMP(3)` for millisecond precision

## Using Prisma Migrations (Alternative)

If you prefer to use Prisma migrations instead of SQL files:

```bash
# Generate Prisma client
docker compose -f docker-compose.prod.yml exec appointment-service sh -c "cd /app && npx prisma generate"

# Run migrations
docker compose -f docker-compose.prod.yml exec appointment-service sh -c "cd /app && npx prisma migrate deploy"
```

