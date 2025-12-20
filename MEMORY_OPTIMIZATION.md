# Memory Optimization Guide

## Summary

The VPS was experiencing 100% memory usage. This document outlines the optimizations made to reduce memory consumption across all services.

## Changes Made

### 1. PostgreSQL (Reduced from 2GB to 1GB)
- **Memory Limit**: Reduced from `2g` to `1g`
- **Memory Reservation**: Reduced from `1g` to `512m`
- **Configuration Optimizations**:
  - `shared_buffers`: 256MB → 128MB
  - `effective_cache_size`: 1GB → 512MB
  - `maintenance_work_mem`: 128MB → 64MB
  - `wal_buffers`: 16MB → 8MB
  - `work_mem`: 4MB → 2MB
  - `min_wal_size`: 1GB → 512MB
  - `max_wal_size`: 4GB → 2GB
  - `max_connections`: 100 → 50
  - `max_worker_processes`: 4 → 2
  - `max_parallel_workers_per_gather`: 2 → 1
  - `max_parallel_workers`: 4 → 2

### 2. Redis (Reduced from 512MB to 384MB)
- **Memory Limit**: Reduced from `512m` to `384m`
- **Memory Reservation**: Reduced from `256m` to `192m`
- **Max Memory**: Reduced from `256mb` to `192mb`

### 3. RabbitMQ (Reduced from 512MB to 384MB)
- **Memory Limit**: Reduced from `512m` to `384m`
- **Memory Reservation**: Reduced from `256m` to `192m`
- **Added**: `RABBITMQ_VM_MEMORY_HIGH_WATERMARK: 0.3` (limits memory to 30% of available)

### 4. Node.js Services (Reduced memory limits)
All Node.js services now have:
- **NODE_OPTIONS**: `--max-old-space-size=<limit>` to limit heap memory
- Reduced container memory limits

#### Service-Specific Changes:
- **user-service**: 512MB → 384MB (Node.js: 256MB)
- **hospital-service**: 512MB → 384MB (Node.js: 256MB)
- **doctor-service**: 512MB → 384MB (Node.js: 256MB)
- **specialty-service**: 256MB → 192MB (Node.js: 128MB)
- **appointment-service**: 512MB → 384MB (Node.js: 256MB)
- **ads-service**: 256MB → 192MB (Node.js: 128MB)
- **payment-service**: 256MB → 192MB (Node.js: 128MB)
- **admin-panel**: 512MB → 384MB (Node.js: 256MB)

### 5. Admin Panel Build (Reduced from 4GB to 2GB)
- **Build Memory**: Reduced from `4096MB` to `2048MB`
- **Note**: This only affects build time, not runtime

## Total Memory Reduction

### Before:
- PostgreSQL: 2GB
- Redis: 512MB
- RabbitMQ: 512MB
- Node.js Services: ~3.5GB
- **Total**: ~6.5GB

### After:
- PostgreSQL: 1GB
- Redis: 384MB
- RabbitMQ: 384MB
- Node.js Services: ~2.3GB
- **Total**: ~4.1GB

**Memory Saved**: ~2.4GB (37% reduction)

## Applying Changes

### Step 1: Update Configuration
The changes have been made to `docker-compose.prod.yml`. Review the changes:
```bash
git diff docker-compose.prod.yml
```

### Step 2: Recreate Containers
To apply the new memory limits, you need to recreate the containers:

```bash
# Stop all services
docker compose -f docker-compose.prod.yml down

# Rebuild and start with new limits
docker compose -f docker-compose.prod.yml up -d --build
```

### Step 3: Monitor Memory Usage
After applying changes, monitor memory usage:

```bash
# Check container memory usage
docker stats --no-stream

# Check overall system memory
free -h

# Check PostgreSQL memory
docker exec postgres psql -U postgres -c "SHOW shared_buffers;"
```

## Monitoring and Troubleshooting

### If Services Fail to Start
If a service fails due to insufficient memory:

1. **Check logs**:
   ```bash
   docker compose -f docker-compose.prod.yml logs <service-name>
   ```

2. **Gradually increase limits** if needed:
   - Edit `docker-compose.prod.yml`
   - Increase `mem_limit` and `NODE_OPTIONS` for the specific service
   - Restart: `docker compose -f docker-compose.prod.yml up -d <service-name>`

### Performance Considerations
- **PostgreSQL**: Reduced `max_connections` may limit concurrent users. Monitor connection usage.
- **Node.js Services**: Lower heap limits may cause more frequent garbage collection. Monitor response times.
- **Redis**: Lower memory may cause more evictions. Monitor hit rates.

### Recommended Monitoring
Set up alerts for:
- Container memory usage > 80%
- System memory usage > 85%
- Service response times
- Database connection pool exhaustion

## Additional Optimizations (Optional)

### 1. Enable Swap (if not already enabled)
```bash
# Check if swap exists
swapon --show

# If no swap, create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Clean Up Docker Resources
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune
```

### 3. Database Maintenance
```bash
# Vacuum database to reclaim space
docker exec postgres psql -U postgres -d <database> -c "VACUUM ANALYZE;"
```

## Notes

- Memory limits are enforced by Docker, but actual usage may be lower
- `mem_reservation` is a soft limit (Docker tries to maintain this)
- `mem_limit` is a hard limit (container will be killed if exceeded)
- `NODE_OPTIONS` limits Node.js heap, but total container memory includes other processes
- PostgreSQL memory settings are conservative for a small VPS
- Consider upgrading VPS if memory issues persist after optimization

