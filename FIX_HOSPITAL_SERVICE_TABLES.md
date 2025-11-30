# Fix Hospital Service - Missing Tables

## Problem

The table `hospitals.hospitals` does not exist in the database. The migrations haven't been run yet.

## Solution

Run Prisma migrations for hospital-service to create all tables in the `hospitals` schema.

## Quick Fix (Run on VPS)

```bash
cd /root/fayo

# 1. Ensure the hospitals schema exists
docker exec -i postgres psql -U postgres -d hospital_service -c 'CREATE SCHEMA IF NOT EXISTS "hospitals";'

# 2. Generate Prisma Client
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma generate"

# 3. Run migrations to create all tables
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma migrate deploy"

# 4. Verify tables were created
docker exec -i postgres psql -U postgres -d hospital_service -c "\dt hospitals.*"

# 5. Restart the service
docker compose -f docker-compose.prod.yml restart hospital-service
```

## Expected Tables After Migration

After running migrations, you should see these tables in the `hospitals` schema:
- `hospitals.hospitals`
- `hospitals.hospital_specialties`
- `hospitals.hospital_services`
- `hospitals.hospital_doctors`
- `hospitals.doctors`
- `hospitals.services`

## Verification

Check if tables exist:
```bash
docker exec -i postgres psql -U postgres -d hospital_service -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'hospitals';"
```

Test the API:
```bash
curl http://72.62.51.50:3002/api/v1/hospitals
```

