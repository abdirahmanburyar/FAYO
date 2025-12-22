# PM2 Deployment Guide - No Docker

## Overview

This guide shows how to run FAYO applications directly on the VPS using PM2, without Docker containers.

## Benefits

✅ **Faster startup** - No container overhead
✅ **Lower memory usage** - No Docker daemon
✅ **Easier debugging** - Direct access to processes
✅ **Faster builds** - No Docker build time
✅ **Better resource utilization** - More efficient

## Prerequisites

### 1. Install Node.js 22.17.1+

```bash
# Using NodeSource (recommended)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node -v  # Should be v22.17.1 or higher
npm -v
```

### 2. Install PM2

```bash
npm install -g pm2
pm2 --version
```

### 3. Infrastructure Services

Install PostgreSQL, Redis, and RabbitMQ directly on the VPS:

```bash
chmod +x install-infrastructure-vps.sh
sudo ./install-infrastructure-vps.sh
```

This will install and configure all infrastructure services directly on the VPS (no Docker needed).

See `INFRASTRUCTURE_SETUP.md` for detailed instructions.

## Setup Steps

### Step 1: Run Setup Script

```bash
cd /root/fayo
chmod +x setup-pm2.sh
./setup-pm2.sh
```

This will:
- Install dependencies for all services (api-service, admin-panel, hospital-panel)
- Build all applications
- Create necessary directories

### Step 2: Setup Infrastructure

```bash
# Install infrastructure directly on VPS
chmod +x install-infrastructure-vps.sh
sudo ./install-infrastructure-vps.sh
```

### Step 3: Setup Database

```bash
# Run migrations
cd services/api-service
npx prisma migrate deploy
cd ../..
```

### Step 4: Run Database Migrations

```bash
cd services/api-service
npx prisma migrate deploy
cd ../..
```

### Step 5: Start Services with PM2

```bash
# Start all services
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# View specific service logs
pm2 logs fayo-api-service
pm2 logs fayo-admin-panel
pm2 logs fayo-hospital-panel
```

**See `START_SERVERS.md` for detailed startup instructions.**

### Step 6: Save PM2 Configuration

```bash
# Save current process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions it prints
```

## PM2 Commands

```bash
# Start services
pm2 start ecosystem.config.js

# Stop services
pm2 stop all
pm2 stop fayo-api-service
pm2 stop fayo-admin-panel
pm2 stop fayo-hospital-panel

# Restart services
pm2 restart all
pm2 restart fayo-api-service
pm2 restart fayo-admin-panel
pm2 restart fayo-hospital-panel

# Delete services
pm2 delete all
pm2 delete fayo-api-service
pm2 delete fayo-admin-panel
pm2 delete fayo-hospital-panel

# View status
pm2 status
pm2 list

# View logs
pm2 logs
pm2 logs fayo-api-service --lines 100
pm2 logs fayo-admin-panel --lines 100
pm2 logs fayo-hospital-panel --lines 100

# Monitor resources
pm2 monit

# Reload (zero-downtime restart)
pm2 reload fayo-api-service
pm2 reload fayo-admin-panel
pm2 reload fayo-hospital-panel
```

## Environment Variables

Create `.env` file in project root or set in `ecosystem.config.js`:

```bash
# .env file
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fayo
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_URL=amqp://guest:guest@localhost:5672
JWT_SECRET=your-secret-key
NEXT_PUBLIC_API_URL=http://72.62.51.50:3001/api/v1
```

## Update Configuration

### Update API Service URL

Since we're not using Docker, update the API service URLs in both panels:

**Admin Panel** (`web/admin-panel/src/config/api.ts`):
```typescript
// Change from Docker service name to localhost
return 'http://localhost:3001';  // Instead of 'http://api-service:3001'
```

**Hospital Panel** (`web/hospital-panel/src/config/api.ts`):
```typescript
// Change from Docker service name to localhost
return 'http://localhost:3001';  // Instead of 'http://api-service:3001'
```

## Infrastructure Services

### Install Infrastructure Directly on VPS

Use the automated script:

```bash
chmod +x install-infrastructure-vps.sh
sudo ./install-infrastructure-vps.sh
```

Or see `INFRASTRUCTURE_SETUP.md` for manual installation steps.

## Deployment Workflow

### 1. Update Code

```bash
cd /root/fayo
git pull  # or transfer files
```

### 2. Install Dependencies

```bash
# API Service
cd services/api-service
npm ci --legacy-peer-deps --no-audit --no-fund
npx prisma generate
npm run build

# Admin Panel
cd ../../web/admin-panel
npm ci --legacy-peer-deps --no-audit --no-fund
npm run build

# Hospital Panel
cd ../hospital-panel
npm ci --legacy-peer-deps --no-audit --no-fund
npm run build
```

### 3. Run Migrations (if needed)

```bash
cd services/api-service
npx prisma migrate deploy
```

### 4. Restart Services

```bash
# Zero-downtime reload
pm2 reload ecosystem.config.js

# Or full restart
pm2 restart all
```

## Monitoring

```bash
# Real-time monitoring
pm2 monit

# Check logs
pm2 logs --lines 50

# Check status
pm2 status

# View detailed info
pm2 describe fayo-api-service
pm2 describe fayo-admin-panel
pm2 describe fayo-hospital-panel
```

## Troubleshooting

### Service won't start

```bash
# Check logs
pm2 logs fayo-api-service --err

# Check if port is in use
netstat -tuln | grep 3001  # API Service
netstat -tuln | grep 3000  # Admin Panel
netstat -tuln | grep 8000  # Hospital Panel

# Check environment variables
pm2 env fayo-api-service
```

### Database connection error

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql
# or
docker ps | grep postgres

# Test connection
psql -U postgres -d fayo -c "SELECT 1;"
```

### Out of memory

```bash
# Check memory usage
pm2 monit

# Reduce memory limits in ecosystem.config.js
max_memory_restart: '300M'  # Instead of 500M
```

## Advantages Over Docker

1. **Faster startup** - No container initialization
2. **Lower memory** - No Docker daemon overhead
3. **Easier debugging** - Direct process access
4. **Faster builds** - No Docker build step
5. **Better performance** - No containerization overhead

## Disadvantages

1. **No isolation** - Processes share system resources
2. **Manual setup** - More configuration needed
3. **OS dependencies** - Need to manage Node.js, etc.

## Recommended Setup

**Best approach**: Hybrid
- **Infrastructure** (PostgreSQL, Redis, RabbitMQ) → Docker
- **Applications** (api-service, admin-panel, hospital-panel) → PM2

This gives you:
- Easy infrastructure management (Docker)
- Fast, efficient application runtime (PM2)
- Best of both worlds

## Application Ports

- **API Service**: Port `3001` - Backend API service
- **Admin Panel**: Port `3000` - Admin management interface
- **Hospital Panel**: Port `8000` - Hospital management interface

## Quick Start

```bash
# 1. Install infrastructure
chmod +x install-infrastructure-vps.sh
sudo ./install-infrastructure-vps.sh

# 2. Setup applications
./setup-pm2.sh

# 3. Run migrations
cd services/api-service && npx prisma migrate deploy && cd ../..

# 4. Start applications
pm2 start ecosystem.config.js

# 5. Save and enable startup
pm2 save
pm2 startup
```

That's it! Your applications are now running with PM2.

