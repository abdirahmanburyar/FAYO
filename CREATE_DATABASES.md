# Create Databases for FAYO Healthcare Services

## Quick Command (Recommended)

### Option 1: Safe Version (Creates only if doesn't exist)
This version won't drop existing databases or terminate active connections:

```bash
cat create-databases-safe.sql | docker exec -i postgres psql -U postgres
```

### Option 2: Full Recreate (Drops and recreates all databases)
⚠️ **Warning**: This will terminate all active connections and drop existing databases!

```bash
cat create-databases.sql | docker exec -i postgres psql -U postgres
```

## Databases Created

The scripts create the following databases:
- `fayo` - Default database
- `user_service` - User management service
- `hospital_service` - Hospital management service
- `doctor_service` - Doctor management service
- `specialty_service` - Specialty management service
- `appointment_service` - Appointment management service
- `ads_service` - Advertisement service
- `payment_service` - Payment processing service

## Manual Step-by-Step (Alternative)

If you prefer to create databases one by one:

```bash
# Create each database (only if doesn't exist)
docker exec -i postgres psql -U postgres -c "CREATE DATABASE IF NOT EXISTS fayo;"
docker exec -i postgres psql -U postgres -c "CREATE DATABASE IF NOT EXISTS user_service;"
docker exec -i postgres psql -U postgres -c "CREATE DATABASE IF NOT EXISTS hospital_service;"
docker exec -i postgres psql -U postgres -c "CREATE DATABASE IF NOT EXISTS doctor_service;"
docker exec -i postgres psql -U postgres -c "CREATE DATABASE IF NOT EXISTS specialty_service;"
docker exec -i postgres psql -U postgres -c "CREATE DATABASE IF NOT EXISTS appointment_service;"
docker exec -i postgres psql -U postgres -c "CREATE DATABASE IF NOT EXISTS ads_service;"
docker exec -i postgres psql -U postgres -c "CREATE DATABASE IF NOT EXISTS payment_service;"
```

## After Creating Databases

### 1. Set up database schemas

For services that use SQL files instead of Prisma migrations:

```bash
# Ads Service (uses SQL file)
cat services/ads-service/ads-service.sql | docker exec -i postgres psql -U postgres -d ads_service
```

For services that use Prisma migrations:

```bash
# User Service
docker compose -f docker-compose.prod.yml exec user-service sh -c "npx prisma generate && npx prisma migrate deploy"

# Hospital Service
docker compose -f docker-compose.prod.yml exec hospital-service sh -c "npx prisma generate && npx prisma migrate deploy"

# Doctor Service
docker compose -f docker-compose.prod.yml exec doctor-service sh -c "npx prisma generate && npx prisma migrate deploy"

# Specialty Service
docker compose -f docker-compose.prod.yml exec specialty-service sh -c "npx prisma generate && npx prisma migrate deploy"

# Appointment Service
docker compose -f docker-compose.prod.yml exec appointment-service sh -c "npx prisma generate && npx prisma migrate deploy"

# Payment Service
docker compose -f docker-compose.prod.yml exec payment-service sh -c "npx prisma generate && npx prisma migrate deploy"
```

### 2. Verify databases were created

```bash
docker exec -i postgres psql -U postgres -c "\l" | grep -E "(fayo|user_service|hospital_service|doctor_service|specialty_service|appointment_service|ads_service|payment_service)"
```

### 3. Restart services (if needed)

```bash
docker compose -f docker-compose.prod.yml restart
```

## Troubleshooting

### Error: "database is being accessed by other users"

If you see this error, you have two options:

1. **Use the safe version** (`create-databases-safe.sql`) which only creates databases that don't exist
2. **Stop the services first**, then run the full recreate script:
   ```bash
   docker compose -f docker-compose.prod.yml stop
   cat create-databases.sql | docker exec -i postgres psql -U postgres
   docker compose -f docker-compose.prod.yml start
   ```

### Error: "database does not exist"

This is normal for new databases. Just run the creation script:
```bash
cat create-databases-safe.sql | docker exec -i postgres psql -U postgres
```

## Notes

- The safe version (`create-databases-safe.sql`) is idempotent - you can run it multiple times safely
- The full recreate version (`create-databases.sql`) will drop and recreate databases, so use with caution
- Always backup your databases before running the full recreate script if you have important data
