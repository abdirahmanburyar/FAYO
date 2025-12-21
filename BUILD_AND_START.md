# Build and Start API Service

## Issue

The error shows:
```
Error: Script not found: /root/fayo/services/api-service/services/api-service/dist/main.js
```

This means:
1. The script path was wrong (fixed in ecosystem.config.js)
2. The API service needs to be built first

## Solution

### Step 1: Build API Service

```bash
cd /root/fayo/services/api-service

# Install dependencies (if not done)
npm install --legacy-peer-deps --no-audit --no-fund

# Generate Prisma client
npx prisma generate

# Build the service
npm run build

# Verify build
ls -la dist/main.js
```

### Step 2: Verify .env File Exists

```bash
# Check if .env exists
ls -la /root/fayo/services/api-service/.env

# If not, create it
cd /root/fayo
./CREATE_ENV_FILE.sh
```

### Step 3: Start with PM2

```bash
cd /root/fayo

# Delete old PM2 process if exists
pm2 delete fayo-api-service 2>/dev/null || true

# Start services
pm2 start ecosystem.config.js

# Check status
pm2 status
```

## Complete Setup (If Starting Fresh)

```bash
cd /root/fayo

# 1. Build API service
cd services/api-service
npm install --legacy-peer-deps --no-audit --no-fund
npx prisma generate
npm run build
cd ../..

# 2. Create .env file
./CREATE_ENV_FILE.sh

# 3. Start services
pm2 start ecosystem.config.js

# 4. Check status
pm2 status
pm2 logs
```

## Verify

```bash
# Check if dist/main.js exists
ls -la /root/fayo/services/api-service/dist/main.js

# Check PM2 status
pm2 status

# Test API
curl http://localhost:3001/api/v1/health
```

