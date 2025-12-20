# User Service Database Setup Guide

This guide explains how to set up the user-service database schema using Docker PostgreSQL.

## Quick Start

### Step 1: Create the Database

```bash
cat create-user-service-db.sql | docker exec -i postgres psql -U postgres
```

Or use the combined script that creates all databases:

```bash
cat create-databases-safe.sql | docker exec -i postgres psql -U postgres
```

### Step 2: Create the Schema

```bash
cat services/user-service/user-service.sql | docker exec -i postgres psql -U postgres -d user_service
```

## Prerequisites

1. Docker and Docker Compose installed
2. PostgreSQL container running
3. Access to the database

## Schema Overview

The schema creates:
- `users` schema
- `UserRole` enum: `PATIENT`, `DOCTOR`, `ADMIN`, `HOSPITAL`, `CLINIC`
- `UserType` enum: `PATIENT`, `DOCTOR`, `HOSPITAL_MANAGER`
- `Gender` enum: `MALE`, `FEMALE`
- `users.users` table with all required columns:
  - `id`, `username`, `email`, `phone`, `password`
  - `firstName`, `lastName`, `role`, `userType`, `isActive`
  - `dateOfBirth`, `gender`, `address`
  - `createdAt`, `updatedAt`
- `users.otp_codes` table for phone verification

## Setup Steps

### Option 1: Direct Execution (Recommended)

Execute the SQL file directly:

```bash
# Create database
cat create-user-service-db.sql | docker exec -i postgres psql -U postgres

# Create schema
cat services/user-service/user-service.sql | docker exec -i postgres psql -U postgres -d user_service
```

### Option 2: Copy and Execute

1. **Copy the SQL file into the container:**
   ```bash
   docker cp services/user-service/user-service.sql postgres:/tmp/user-service.sql
   ```

2. **Execute the SQL file:**
   ```bash
   docker exec -i postgres psql -U postgres -d user_service -f /tmp/user-service.sql
   ```

## Create Admin User (Optional)

After setting up the schema, you can create an admin user:

```bash
cat services/user-service/create-admin.sql | docker exec -i postgres psql -U postgres -d user_service
```

**Default Admin Credentials:**
- Username: `0001`
- Password: `admin123`
- Email: `admin@fayo.com`

⚠️ **IMPORTANT**: Change the default password after first login!

## Verification

After running the SQL file, verify the schema:

```bash
# Check table structure
docker exec -i postgres psql -U postgres -d user_service -c "\d users.users"
docker exec -i postgres psql -U postgres -d user_service -c "\d users.otp_codes"

# Check enum values
docker exec -i postgres psql -U postgres -d user_service -c "SELECT unnest(enum_range(NULL::users.\"UserRole\")) AS role_values;"
docker exec -i postgres psql -U postgres -d user_service -c "SELECT unnest(enum_range(NULL::users.\"UserType\")) AS type_values;"
docker exec -i postgres psql -U postgres -d user_service -c "SELECT unnest(enum_range(NULL::users.\"Gender\")) AS gender_values;"

# Check indexes
docker exec -i postgres psql -U postgres -d user_service -c "\d users.users" | grep -i index

# Check sample data (if any)
docker exec -i postgres psql -U postgres -d user_service -c "SELECT id, username, email, role, \"userType\", \"isActive\" FROM users.users LIMIT 5;"
```

## Notes

- The SQL file is **idempotent** - it uses `IF NOT EXISTS` checks, so it's safe to run multiple times
- The schema matches the Prisma schema in `prisma/schema.prisma`
- After running the SQL file, regenerate Prisma client: `npx prisma generate`
- The service will automatically create an admin user on first startup if one doesn't exist (see `start.sh`)

## Using Prisma Migrations (Alternative)

If you prefer to use Prisma migrations instead of SQL files:

```bash
# Generate Prisma client
docker compose -f docker-compose.prod.yml exec user-service sh -c "cd /app && npx prisma generate"

# Run migrations
docker compose -f docker-compose.prod.yml exec user-service sh -c "cd /app && npx prisma migrate deploy"
```

