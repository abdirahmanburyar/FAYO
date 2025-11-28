# Fix Doctor Service - Missing selfEmployedConsultationFee Column

## Problem

The `doctor-service` Prisma schema has `selfEmployedConsultationFee` but the database column doesn't exist.

## Solution

Add the missing column to the database and regenerate Prisma client.

## Quick Fix (Run on VPS)

```bash
cd /root/fayo

# Step 1: Check current table structure
docker exec -i postgres psql -U postgres -d doctor_service -c "\d doctors"

# Step 2: Add the missing column
docker exec -i postgres psql -U postgres -d doctor_service << 'EOF'
-- Add selfEmployedConsultationFee column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'doctors' 
        AND column_name = 'selfEmployedConsultationFee'
    ) THEN
        ALTER TABLE "doctors" ADD COLUMN "selfEmployedConsultationFee" INTEGER;
        RAISE NOTICE 'Column selfEmployedConsultationFee added successfully';
    ELSE
        RAISE NOTICE 'Column selfEmployedConsultationFee already exists';
    END IF;
END $$;
EOF

# Step 3: Verify column was added
docker exec -i postgres psql -U postgres -d doctor_service -c "\d doctors"

# Step 4: Regenerate Prisma Client
docker compose -f docker-compose.prod.yml exec doctor-service sh -c "cd /app && npx prisma generate"

# Step 5: Restart the service
docker compose -f docker-compose.prod.yml restart doctor-service
```

## Alternative: Create a Migration

If you prefer to use Prisma migrations:

```bash
cd /root/fayo

# Create a new migration
docker compose -f docker-compose.prod.yml exec doctor-service sh -c "cd /app && npx prisma migrate dev --name add_self_employed_consultation_fee --create-only"

# Then apply it
docker compose -f docker-compose.prod.yml exec doctor-service sh -c "cd /app && npx prisma migrate deploy"
```

