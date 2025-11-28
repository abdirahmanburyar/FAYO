# Resolve Failed Migration in Hospital Service

## Problem

The migration `20251115212150_init` failed and is blocking new migrations from running. Error: P3009

## Solution

We need to mark the failed migration as rolled back, then re-run the migrations.

## Steps to Fix

### Option 1: Mark Migration as Rolled Back (Recommended)

If the migration partially applied, mark it as rolled back:

```bash
cd /root/fayo

# Mark the failed migration as rolled back
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma migrate resolve --rolled-back 20251115212150_init"

# Now run migrations again
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma migrate deploy"
```

### Option 2: Mark Migration as Applied (If tables already exist)

If the migration actually succeeded but Prisma thinks it failed:

```bash
cd /root/fayo

# Mark the migration as applied
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma migrate resolve --applied 20251115212150_init"

# Run remaining migrations
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma migrate deploy"
```

### Option 3: Check Migration Status First

Before resolving, check what the actual status is:

```bash
cd /root/fayo

# Check migration status
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma migrate status"

# Check if tables exist
docker exec -i postgres psql -U postgres -d hospital_service -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'hospitals';"
```

## Recommended Approach

1. **First, check if tables exist:**
```bash
docker exec -i postgres psql -U postgres -d hospital_service -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'hospitals';"
```

2. **If tables DON'T exist, mark as rolled back and re-run:**
```bash
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma migrate resolve --rolled-back 20251115212150_init"
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma migrate deploy"
```

3. **If tables DO exist, mark as applied:**
```bash
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma migrate resolve --applied 20251115212150_init"
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma migrate deploy"
```

4. **Restart the service:**
```bash
docker compose -f docker-compose.prod.yml restart hospital-service
```

