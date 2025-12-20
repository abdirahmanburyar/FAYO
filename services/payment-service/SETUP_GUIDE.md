# Payment Service Database Setup Guide

This guide explains how to set up the payment-service database schema using Docker PostgreSQL.

## Quick Start

### Step 1: Create the Database

```bash
cat create-payment-service-db.sql | docker exec -i postgres psql -U postgres
```

Or use a direct command:
```bash
docker exec -i postgres psql -U postgres -c "CREATE DATABASE payment_service;" 2>/dev/null || echo "Database may already exist"
```

### Step 2: Create the Schema

```bash
cat services/payment-service/payment-service.sql | docker exec -i postgres psql -U postgres -d payment_service
```

## Updating Existing Schema

If you have an existing `payments.payments` table that's missing the `paymentType` column, run:

```bash
cat services/payment-service/add-missing-payment-type.sql | docker exec -i postgres psql -U postgres -d payment_service
```

This will add:
- `PaymentType` enum
- `paymentType` column
- `adId` column
- Required indexes

## Prerequisites

1. Docker and Docker Compose installed
2. PostgreSQL container running
3. Access to the database
4. Other service databases should exist (for references):
   - `appointment_service` (for appointmentId)
   - `ads_service` (for adId)
   - `user_service` (for paidBy, processedBy)

## Schema Overview

The schema creates the following in the `payments` schema:

### Enums

1. **`PaymentMethod`** - Method of payment
   - `CASH` - Cash payment
   - `CARD` - Credit/debit card
   - `BANK_TRANSFER` - Bank transfer
   - `MOBILE_MONEY` - Mobile money payment
   - `CHEQUE` - Cheque payment
   - `OTHER` - Other payment methods

2. **`PaymentType`** - Type of payment
   - `APPOINTMENT` - Payment for appointment
   - `AD` - Payment for advertisement

3. **`PaymentStatus`** - Payment status
   - `PAID` - Payment has been completed
   - `REFUNDED` - Payment has been refunded
   - `CANCELLED` - Payment was cancelled

### Tables

**`payments.payments`** - Payment information
- `id` - Primary key (TEXT, CUID format)
- `paymentType` - Type of payment: APPOINTMENT or AD (default: APPOINTMENT)
- `appointmentId` - Reference to appointment ID (optional, for appointment payments)
- `adId` - Reference to ad ID (optional, for ad payments)
- `amount` - Payment amount in cents
- `currency` - Currency code (default: USD)
- `paymentMethod` - Method of payment (required)
- `paymentStatus` - Payment status (default: PAID)
- `transactionId` - External transaction ID (optional, unique)
- `receiptNumber` - Internal receipt number (optional, unique)
- `paidBy` - User ID who made the payment (optional)
- `processedBy` - Admin/staff ID who processed the payment (optional)
- `notes` - Additional notes (optional)
- `paymentDate` - When payment was actually made (optional)
- `processedAt` - When payment was processed (optional)
- `refundedAt` - When payment was refunded (optional)
- `refundReason` - Reason for refund (optional)
- `refundedBy` - User ID who processed refund (optional)
- `metadata` - Additional payment metadata in JSON format (optional)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Indexes

- Unique index on `transactionId` (where not null)
- Unique index on `receiptNumber` (where not null)
- Indexes on: `appointmentId`, `adId`, `paymentType`, `paymentStatus`, `paymentMethod`, `transactionId`, `receiptNumber`, `paidBy`, `processedBy`, `paymentDate`

## Setup Steps

### Option 1: Direct Execution (Recommended)

Execute the SQL file directly:

```bash
# Create database
cat create-payment-service-db.sql | docker exec -i postgres psql -U postgres

# Create schema
cat services/payment-service/payment-service.sql | docker exec -i postgres psql -U postgres -d payment_service
```

### Option 2: Copy and Execute

1. **Copy the SQL file into the container:**
   ```bash
   docker cp services/payment-service/payment-service.sql postgres:/tmp/payment-service.sql
   ```

2. **Execute the SQL file:**
   ```bash
   docker exec -i postgres psql -U postgres -d payment_service -f /tmp/payment-service.sql
   ```

## Verification

After running the SQL file, verify the schema:

```bash
# Check schema exists
docker exec -i postgres psql -U postgres -d payment_service -c "\dn payments"

# Check table structure
docker exec -i postgres psql -U postgres -d payment_service -c "\d payments.payments"

# Check enum values
docker exec -i postgres psql -U postgres -d payment_service -c "SELECT unnest(enum_range(NULL::payments.\"PaymentMethod\")) AS method_values;"
docker exec -i postgres psql -U postgres -d payment_service -c "SELECT unnest(enum_range(NULL::payments.\"PaymentType\")) AS type_values;"
docker exec -i postgres psql -U postgres -d payment_service -c "SELECT unnest(enum_range(NULL::payments.\"PaymentStatus\")) AS status_values;"

# Check indexes
docker exec -i postgres psql -U postgres -d payment_service -c "\d payments.payments" | grep -i index

# Check sample data (if any)
docker exec -i postgres psql -U postgres -d payment_service -c "SELECT COUNT(*) FROM payments.payments;"
```

## Notes

- The SQL file is **idempotent** - it uses `IF NOT EXISTS` checks, so it's safe to run multiple times
- The schema matches the Prisma schema in `prisma/schema.prisma`
- After running the SQL file, regenerate Prisma client: `npx prisma generate`
- The `appointmentId` and `adId` fields reference external services
- The `paidBy` and `processedBy` fields reference users in the `user_service` database
- The `metadata` field uses JSONB for efficient JSON storage and querying
- Either `appointmentId` (for APPOINTMENT payments) or `adId` (for AD payments) should be provided based on `paymentType`

## Using Prisma Migrations (Alternative)

If you prefer to use Prisma migrations instead of SQL files:

```bash
# Generate Prisma client
docker compose -f docker-compose.prod.yml exec payment-service sh -c "cd /app && npx prisma generate"

# Run migrations
docker compose -f docker-compose.prod.yml exec payment-service sh -c "cd /app && npx prisma migrate deploy"
```

