# Create Databases for FAYO Healthcare Services

## Quick Command (Run on VPS)

Run this command on your VPS to create all required databases:

```bash
docker exec -i postgres psql -U postgres << 'EOF'
-- Create databases
CREATE DATABASE user_service;
CREATE DATABASE hospital_service;
CREATE DATABASE doctor_service;
CREATE DATABASE specialty_service;
CREATE DATABASE appointment_service;
CREATE DATABASE payment_service;
EOF

# Create hospitals schema for hospital-service
docker exec -i postgres psql -U postgres -d hospital_service -c 'CREATE SCHEMA IF NOT EXISTS "hospitals";'
```

## Or Use the Script

```bash
cd /root/fayo
bash scripts/create-databases.sh
```

## Manual Step-by-Step

If you prefer to create databases one by one:

```bash
# Create each database
docker exec -i postgres psql -U postgres -c "CREATE DATABASE user_service;"
docker exec -i postgres psql -U postgres -c "CREATE DATABASE hospital_service;"
docker exec -i postgres psql -U postgres -c "CREATE DATABASE doctor_service;"
docker exec -i postgres psql -U postgres -c "CREATE DATABASE specialty_service;"
docker exec -i postgres psql -U postgres -c "CREATE DATABASE appointment_service;"
docker exec -i postgres psql -U postgres -c "CREATE DATABASE payment_service;"

# Create hospitals schema for hospital-service (uses multi-schema)
docker exec -i postgres psql -U postgres -d hospital_service -c 'CREATE SCHEMA IF NOT EXISTS "hospitals";'
```

## After Creating Databases

1. Run Prisma migrations for each service:
```bash
cd /root/fayo
docker compose -f docker-compose.prod.yml exec user-service npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec hospital-service npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec doctor-service npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec specialty-service npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec appointment-service npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec payment-service npx prisma migrate deploy
```

2. Restart services:
```bash
docker compose -f docker-compose.prod.yml restart
```

## Note

The CI/CD workflow now automatically creates databases during deployment, so you only need to do this manually if you're setting up for the first time or if something went wrong.

