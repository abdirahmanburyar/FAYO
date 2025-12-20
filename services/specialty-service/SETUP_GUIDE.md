# Specialty Service Database Setup Guide

This guide explains how to set up the specialty-service database schema using Docker PostgreSQL.

## Quick Start

### Step 1: Create the Database

```bash
cat create-specialty-service-db.sql | docker exec -i postgres psql -U postgres
```

Or use the combined script that creates all databases:

```bash
cat create-databases-safe.sql | docker exec -i postgres psql -U postgres
```

### Step 2: Create the Schema

```bash
cat services/specialty-service/specialty-service.sql | docker exec -i postgres psql -U postgres -d specialty_service
```

## Prerequisites

1. Docker and Docker Compose installed
2. PostgreSQL container running
3. Access to the database

## Schema Overview

The schema creates a simple table in the `public` schema:

### Tables

**`specialties`** - Medical specialties information
- `id` - Primary key (TEXT, CUID format)
- `name` - Unique name of the specialty (e.g., "Cardiology", "Pediatrics")
- `description` - Optional description of the specialty
- `isActive` - Whether the specialty is currently active/available (default: true)
- `createdAt` - Timestamp when the specialty was created
- `updatedAt` - Timestamp when the specialty was last updated

### Indexes

- Unique index on `name` to ensure specialty names are unique

## Setup Steps

### Option 1: Direct Execution (Recommended)

Execute the SQL file directly:

```bash
# Create database
cat create-specialty-service-db.sql | docker exec -i postgres psql -U postgres

# Create schema
cat services/specialty-service/specialty-service.sql | docker exec -i postgres psql -U postgres -d specialty_service
```

### Option 2: Copy and Execute

1. **Copy the SQL file into the container:**
   ```bash
   docker cp services/specialty-service/specialty-service.sql postgres:/tmp/specialty-service.sql
   ```

2. **Execute the SQL file:**
   ```bash
   docker exec -i postgres psql -U postgres -d specialty_service -f /tmp/specialty-service.sql
   ```

## Verification

After running the SQL file, verify the schema:

```bash
# Check table structure
docker exec -i postgres psql -U postgres -d specialty_service -c "\d specialties"

# Check indexes
docker exec -i postgres psql -U postgres -d specialty_service -c "\d specialties" | grep -i index

# Check sample data (if any)
docker exec -i postgres psql -U postgres -d specialty_service -c "SELECT * FROM specialties LIMIT 10;"

# Count specialties
docker exec -i postgres psql -U postgres -d specialty_service -c "SELECT COUNT(*) FROM specialties;"
```

## Sample Data (Optional)

You can insert some common medical specialties:

```sql
INSERT INTO specialties (id, name, description, "isActive") VALUES
('cardiology', 'Cardiology', 'Heart and cardiovascular system', true),
('pediatrics', 'Pediatrics', 'Medical care for infants, children, and adolescents', true),
('orthopedics', 'Orthopedics', 'Musculoskeletal system', true),
('neurology', 'Neurology', 'Nervous system disorders', true),
('dermatology', 'Dermatology', 'Skin, hair, and nails', true),
('psychiatry', 'Psychiatry', 'Mental health and behavioral disorders', true),
('oncology', 'Oncology', 'Cancer treatment', true),
('gastroenterology', 'Gastroenterology', 'Digestive system', true)
ON CONFLICT (name) DO NOTHING;
```

To insert sample data:

```bash
docker exec -i postgres psql -U postgres -d specialty_service <<EOF
INSERT INTO specialties (id, name, description, "isActive") VALUES
('cardiology', 'Cardiology', 'Heart and cardiovascular system', true),
('pediatrics', 'Pediatrics', 'Medical care for infants, children, and adolescents', true),
('orthopedics', 'Orthopedics', 'Musculoskeletal system', true),
('neurology', 'Neurology', 'Nervous system disorders', true),
('dermatology', 'Dermatology', 'Skin, hair, and nails', true),
('psychiatry', 'Psychiatry', 'Mental health and behavioral disorders', true),
('oncology', 'Oncology', 'Cancer treatment', true),
('gastroenterology', 'Gastroenterology', 'Digestive system', true)
ON CONFLICT (name) DO NOTHING;
EOF
```

## Notes

- The SQL file is **idempotent** - it uses `IF NOT EXISTS` checks, so it's safe to run multiple times
- The schema matches the Prisma schema in `prisma/schema.prisma`
- After running the SQL file, regenerate Prisma client: `npx prisma generate`
- Specialty IDs are referenced by other services (e.g., `doctor_specialties.specialtyId` in doctor-service)
- The `name` field is unique to prevent duplicate specialties

## Using Prisma Migrations (Alternative)

If you prefer to use Prisma migrations instead of SQL files:

```bash
# Generate Prisma client
docker compose -f docker-compose.prod.yml exec specialty-service sh -c "cd /app && npx prisma generate"

# Run migrations
docker compose -f docker-compose.prod.yml exec specialty-service sh -c "cd /app && npx prisma migrate deploy"
```

