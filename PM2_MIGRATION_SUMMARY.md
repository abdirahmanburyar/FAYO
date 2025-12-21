# PM2 Migration Summary

## What Changed

✅ **Removed Dockerfiles**
- `web/admin-panel/Dockerfile` - Deleted
- `services/api-service/Dockerfile` - Deleted

✅ **Removed Docker Compose**
- `docker-compose.prod.yml` - Deleted (no longer needed)
- All services now run directly on VPS (no Docker)

✅ **Created PM2 Configuration**
- `ecosystem.config.js` - PM2 configuration for both services
- `setup-pm2.sh` - Initial setup script
- `deploy-pm2.sh` - Deployment script for updates

✅ **Infrastructure Installation**
- `install-infrastructure-vps.sh` - Direct installation on VPS (no Docker)

✅ **Updated Configuration**
- `web/admin-panel/src/config/api.ts` - Changed from `http://api-service:3001` to `http://localhost:3001`

## Architecture

### Before (Docker)
```
┌─────────────────────────────────────┐
│  Docker Compose                     │
│  ┌──────────┐  ┌──────────┐         │
│  │ api-svc  │  │ admin   │         │
│  └──────────┘  └──────────┘         │
│  ┌──────────┐  ┌──────────┐        │
│  │ postgres │  │ redis    │        │
│  └──────────┘  └──────────┘        │
│  ┌──────────┐                       │
│  │ rabbitmq │                       │
│  └──────────┘                       │
└─────────────────────────────────────┘
```

### After (PM2 + Direct Installation)
```
┌─────────────────────────────────────┐
│  PM2 (Applications)                  │
│  ┌──────────┐  ┌──────────┐        │
│  │ api-svc  │  │ admin    │        │
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘
         │              │
         └──────┬───────┘
                │
┌─────────────────────────────────────┐
│  Direct Installation (VPS)          │
│  ┌──────────┐  ┌──────────┐        │
│  │ postgres │  │ redis    │        │
│  └──────────┘  └──────────┘        │
│  ┌──────────┐                       │
│  │ rabbitmq │                       │
│  └──────────┘                       │
└─────────────────────────────────────┘
```

## Quick Start

### 1. Setup Infrastructure

```bash
chmod +x install-infrastructure-vps.sh
sudo ./install-infrastructure-vps.sh
```

### 2. Setup Applications

```bash
# Initial setup
chmod +x setup-pm2.sh
./setup-pm2.sh

# Run migrations
cd services/api-service
npx prisma migrate deploy
cd ../..

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Deploy Updates

```bash
# After code changes
chmod +x deploy-pm2.sh
./deploy-pm2.sh
```

## Benefits

✅ **Faster Startup** - No container initialization
✅ **Lower Memory** - No Docker daemon overhead (~100-200MB saved)
✅ **Faster Builds** - No Docker build step
✅ **Better Performance** - No containerization overhead
✅ **Easier Debugging** - Direct process access
✅ **Simpler Deployment** - Just `git pull` and `pm2 reload`

## File Structure

```
.
├── ecosystem.config.js              # PM2 configuration
├── setup-pm2.sh                     # Initial setup
├── deploy-pm2.sh                    # Deployment script
├── install-infrastructure-vps.sh    # Infrastructure install script
├── PM2_DEPLOYMENT_GUIDE.md         # Full guide
├── INFRASTRUCTURE_SETUP.md          # Infrastructure options
├── services/
│   └── api-service/                 # No Dockerfile
└── web/
    └── admin-panel/                 # No Dockerfile
```

## Environment Variables

### PM2 (ecosystem.config.js)

```javascript
// API Service
DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/fayo'
REDIS_HOST: 'localhost'
REDIS_PORT: 6379
RABBITMQ_URL: 'amqp://guest:guest@localhost:5672'
PORT: 3001

// Admin Panel
API_SERVICE_URL: 'http://localhost:3001'
NEXT_PUBLIC_API_URL: 'http://72.62.51.50:3001/api/v1'
PORT: 3000
```

## Commands Reference

### PM2
```bash
pm2 start ecosystem.config.js    # Start all
pm2 stop all                      # Stop all
pm2 restart all                   # Restart all
pm2 reload all                     # Zero-downtime reload
pm2 logs                          # View logs
pm2 monit                         # Monitor
pm2 status                        # Status
```

### Infrastructure Services
```bash
sudo systemctl status postgresql
sudo systemctl status redis-server
sudo systemctl status rabbitmq-server
```

## Migration Checklist

- [x] Remove Dockerfiles for applications
- [x] Remove docker-compose.prod.yml (no longer needed)
- [x] Create PM2 ecosystem config
- [x] Create setup scripts
- [x] Update API URLs (localhost instead of service names)
- [x] Create infrastructure installation script
- [x] Update documentation

## Next Steps

1. **On VPS**: Run `setup-pm2.sh`
2. **Start Infrastructure**: Choose Docker or direct install
3. **Run Migrations**: `cd services/api-service && npx prisma migrate deploy`
4. **Start PM2**: `pm2 start ecosystem.config.js`
5. **Save & Enable**: `pm2 save && pm2 startup`

## Support

- **PM2 Guide**: See `PM2_DEPLOYMENT_GUIDE.md`
- **Infrastructure**: See `INFRASTRUCTURE_SETUP.md`
- **Troubleshooting**: Check logs with `pm2 logs`

