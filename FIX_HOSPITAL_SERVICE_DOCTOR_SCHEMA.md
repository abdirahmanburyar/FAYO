# Fix Hospital Service Doctor Schema Issue

## Problem

The `hospital-service` is trying to access a column `doctors.selfEmployedConsultationFee` that doesn't exist in the database. This happens when Prisma includes the `doctor` relation and tries to select all fields.

## Solution

### Option 1: Regenerate Prisma Client (Recommended)

The Prisma client was likely generated with an old schema. Regenerate it to match the current schema:

```bash
cd /root/fayo
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma generate"
```

### Option 2: Check and Fix Database Schema

If the column should exist, add it via migration. If it shouldn't exist, ensure the Prisma client matches the database.

### Option 3: Use Explicit Field Selection (Already Fixed)

The code has been updated to explicitly select only fields that exist in the schema instead of using `include: { doctor: true }`. This prevents Prisma from trying to select non-existent fields.

## Steps to Fix on VPS

1. **Regenerate Prisma Client:**
```bash
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "cd /app && npx prisma generate"
```

2. **Restart the service:**
```bash
docker compose -f docker-compose.prod.yml restart hospital-service
```

3. **Check logs to verify:**
```bash
docker logs hospital-service --tail 50
```

## Verification

After fixing, test the endpoint:
```bash
curl http://72.62.51.50:3002/api/v1/doctors
```

Or test via the hospital doctors endpoint:
```bash
curl http://72.62.51.50:3002/api/v1/hospitals/{hospitalId}/doctors
```

