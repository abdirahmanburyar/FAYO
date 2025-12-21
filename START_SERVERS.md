# How to Start Servers with PM2

## Quick Start

After running `./setup-pm2.sh`, start your servers:

```bash
# Start all services
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs
```

## Step-by-Step

### 1. Ensure Infrastructure is Running

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Check Redis
sudo systemctl status redis-server

# Check RabbitMQ
sudo systemctl status rabbitmq-server
```

If any are not running:
```bash
sudo systemctl start postgresql
sudo systemctl start redis-server
sudo systemctl start rabbitmq-server
```

### 2. Run Database Migrations

```bash
cd services/api-service
npx prisma migrate deploy
cd ../..
```

### 3. Start Services with PM2

```bash
# Start all services defined in ecosystem.config.js
pm2 start ecosystem.config.js

# Or start individually:
pm2 start ecosystem.config.js --only fayo-api-service
pm2 start ecosystem.config.js --only fayo-admin-panel
```

### 4. Save PM2 Configuration

```bash
# Save current process list
pm2 save
```

### 5. Setup PM2 to Start on Boot

```bash
# Generate startup script
pm2 startup

# Follow the instructions it prints (usually something like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

## Verify Services are Running

```bash
# Check PM2 status
pm2 status

# Should show:
# ┌─────┬──────────────────────┬─────────┬─────────┬──────────┬─────────┐
# │ id  │ name                 │ mode    │ ↺       │ status   │ cpu    │
# ├─────┼──────────────────────┼─────────┼─────────┼──────────┼─────────┤
# │ 0   │ fayo-api-service     │ fork    │ 0       │ online   │ 0%     │
# │ 1   │ fayo-admin-panel     │ fork    │ 0       │ online   │ 0%     │
# └─────┴──────────────────────┴─────────┴─────────┴──────────┴─────────┘

# Test API service
curl http://localhost:3001/api/v1/health

# Test admin panel
curl http://localhost:3000/api/health
```

## Useful PM2 Commands

```bash
# View logs
pm2 logs                    # All services
pm2 logs fayo-api-service  # Specific service
pm2 logs --lines 100       # Last 100 lines

# Monitor resources
pm2 monit

# Restart services
pm2 restart all
pm2 restart fayo-api-service

# Stop services
pm2 stop all
pm2 stop fayo-api-service

# Delete services
pm2 delete all
pm2 delete fayo-api-service

# Reload (zero-downtime)
pm2 reload all
```

## Troubleshooting

### Service won't start

```bash
# Check logs
pm2 logs fayo-api-service --err

# Check if port is in use
netstat -tuln | grep 3001
netstat -tuln | grep 3000

# Check environment variables
pm2 env fayo-api-service
```

### Database connection error

```bash
# Test PostgreSQL connection
psql -U postgres -d fayo -c "SELECT 1;"

# Check if database exists
psql -U postgres -l | grep fayo
```

### Port already in use

```bash
# Find process using port
sudo lsof -i :3001
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 <PID>
```

## Complete Startup Sequence

```bash
# 1. Start infrastructure (if not already running)
sudo systemctl start postgresql redis-server rabbitmq-server

# 2. Run migrations
cd services/api-service && npx prisma migrate deploy && cd ../..

# 3. Start PM2 services
pm2 start ecosystem.config.js

# 4. Save and enable startup
pm2 save
pm2 startup  # Follow instructions

# 5. Verify
pm2 status
curl http://localhost:3001/api/v1/health
curl http://localhost:3000/api/health
```

## Access Your Services

- **API Service**: http://72.62.51.50:3001/api/v1
- **Admin Panel**: http://72.62.51.50:3000
- **RabbitMQ Management**: http://72.62.51.50:15672 (guest/guest)

