# Doctor Service Database Setup

## Quick Fix: Create the Database

### Step 1: Connect to PostgreSQL
```bash
psql -U postgres
```

### Step 2: Create the Database
```sql
CREATE DATABASE doctor_service;
\q
```

### Step 3: Run Migrations
```bash
cd C:\FAYO\services\doctor-service
npx prisma migrate deploy
```

Or if you need to push the schema:
```bash
npx prisma db push
```

### Step 4: Restart the Service
Restart your doctor-service after the database is created.

## Alternative: Use Same Database with Schema

If you want to use the same database as hospital-service:

1. Update `.env`:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fayo?schema=doctors"
   ```

2. Update `prisma/schema.prisma`:
   ```prisma
   generator client {
     provider        = "prisma-client-js"
     previewFeatures = ["multiSchema"]
     binaryTargets   = ["native", "linux-musl-openssl-3.0.x"]
   }

   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     schemas  = ["doctors"]
   }
   ```

3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

## Check PostgreSQL is Running

If you get connection errors, make sure PostgreSQL is running:
- Windows: Check Services (services.msc) for "postgresql" service
- Or try: `pg_isready -h localhost -p 5432`

