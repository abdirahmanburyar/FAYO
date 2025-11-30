# Fix Specialty Service Connection Issue

## Problem

Cannot connect to specialty-service on port 3004. The service may not be running, crashing, or has database issues.

## Diagnostic Steps

### Step 1: Check Service Status

```bash
cd /root/fayo

# Check if container is running
docker ps -a | grep specialty-service

# Check service status in docker compose
docker compose -f docker-compose.prod.yml ps specialty-service
```

### Step 2: Check Service Logs

```bash
# Check recent logs
docker logs specialty-service --tail 100

# Check logs in real-time
docker logs specialty-service -f
```

### Step 3: Check Database

```bash
# Verify specialty_service database exists
docker exec -i postgres psql -U postgres -c "\l" | grep specialty_service

# Check if tables exist
docker exec -i postgres psql -U postgres -d specialty_service -c "\dt"
```

### Step 4: Test Health Endpoint

```bash
# Test from inside the container
docker exec specialty-service curl http://localhost:3004/api/v1/health

# Test from host
curl http://localhost:3004/api/v1/health

# Test from external IP
curl http://72.62.51.50:3004/api/v1/health
```

## Common Fixes

### Fix 1: Service Not Running

```bash
cd /root/fayo

# Start the service
docker compose -f docker-compose.prod.yml up -d specialty-service

# Wait a bit and check status
sleep 10
docker compose -f docker-compose.prod.yml ps specialty-service
```

### Fix 2: Database Issues

```bash
# Create database if it doesn't exist
docker exec -i postgres psql -U postgres -c "CREATE DATABASE specialty_service;"

# Run migrations
docker compose -f docker-compose.prod.yml exec specialty-service sh -c "cd /app && npx prisma generate && npx prisma migrate deploy"
```

### Fix 3: Service Restarting (Crash Loop)

```bash
# Check logs for errors
docker logs specialty-service --tail 200

# Common issues:
# - Missing database tables (run migrations)
# - Missing environment variables
# - Port conflicts
# - Prisma client issues (regenerate)
```

### Fix 4: Regenerate Prisma Client

```bash
# Regenerate Prisma client
docker compose -f docker-compose.prod.yml exec specialty-service sh -c "cd /app && npx prisma generate"

# Restart service
docker compose -f docker-compose.prod.yml restart specialty-service
```

### Fix 5: Complete Reset

```bash
cd /root/fayo

# Stop the service
docker compose -f docker-compose.prod.yml stop specialty-service

# Remove the container
docker compose -f docker-compose.prod.yml rm -f specialty-service

# Rebuild and start
docker compose -f docker-compose.prod.yml build specialty-service
docker compose -f docker-compose.prod.yml up -d specialty-service

# Wait and check logs
sleep 15
docker logs specialty-service --tail 50
```

## Quick Diagnostic Command

Run this to get a full status report:

```bash
cd /root/fayo

echo "=== Container Status ==="
docker ps -a | grep specialty-service

echo ""
echo "=== Service Logs (last 50 lines) ==="
docker logs specialty-service --tail 50

echo ""
echo "=== Database Check ==="
docker exec -i postgres psql -U postgres -c "SELECT datname FROM pg_database WHERE datname = 'specialty_service';"

echo ""
echo "=== Health Check ==="
docker exec specialty-service node -e "require('http').get('http://localhost:3004/api/v1/health', (res) => { console.log('Status:', res.statusCode); process.exit(res.statusCode === 200 ? 0 : 1); })" 2>&1 || echo "Health check failed"
```

## After Fixing

Once the service is running, verify it's accessible:

```bash
# Test from host
curl http://localhost:3004/api/v1/health

# Should return: {"status":"ok","service":"specialty-service"}
```

