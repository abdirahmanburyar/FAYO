# Start API Service with PM2

## Quick Start

```bash
# Start only api-service
pm2 start ecosystem.config.js --only fayo-api-service
```

## Before Starting

Make sure:
1. **PostgreSQL is running**
   ```bash
   sudo systemctl status postgresql
   ```

2. **Database migrations are run**
   ```bash
   cd services/api-service
   npx prisma migrate deploy
   cd ../..
   ```

3. **API service is built**
   ```bash
   cd services/api-service
   npm run build
   cd ../..
   ```

## Start API Service

```bash
# Start only api-service
pm2 start ecosystem.config.js --only fayo-api-service
```

## Verify It's Running

```bash
# Check status
pm2 status

# Should show fayo-api-service as "online"

# Test the API
curl http://localhost:3001/api/v1/health

# Should return: {"status":"ok"}
```

## View Logs

```bash
# View api-service logs
pm2 logs fayo-api-service

# View last 100 lines
pm2 logs fayo-api-service --lines 100
```

## Common Issues

### Port 3001 already in use
```bash
# Find process using port
sudo lsof -i :3001

# Kill if needed
sudo kill -9 <PID>
```

### Database connection error
```bash
# Test PostgreSQL connection
psql -U postgres -d fayo -c "SELECT 1;"

# Check if database exists
psql -U postgres -l | grep fayo
```

### Service won't start
```bash
# Check error logs
pm2 logs fayo-api-service --err

# Check if built
ls -la services/api-service/dist/main.js
```

## Start Both Services

```bash
# Start both api-service and admin-panel
pm2 start ecosystem.config.js
```

## Access API Service

- **Local**: http://localhost:3001/api/v1
- **External**: http://72.62.51.50:3001/api/v1
- **Health Check**: http://72.62.51.50:3001/api/v1/health

