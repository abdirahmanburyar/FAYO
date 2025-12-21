# Infrastructure Setup Guide

## Overview

Install infrastructure services (PostgreSQL, Redis, RabbitMQ) directly on the VPS - no Docker needed.

## Direct Installation on VPS

### Automated Installation

```bash
# Make script executable
chmod +x install-infrastructure-vps.sh

# Run installation
sudo ./install-infrastructure-vps.sh
```

This script will:
- Install PostgreSQL 15
- Install Redis 7
- Install RabbitMQ 3
- Configure all services
- Create `fayo` database
- Set up optimized configurations

### Manual Installation

#### PostgreSQL

```bash
# Install
sudo apt-get update
sudo apt-get install -y postgresql-15 postgresql-contrib-15

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql -c "CREATE DATABASE fayo;"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

#### Redis

```bash
# Install
sudo apt-get install -y redis-server

# Configure (edit /etc/redis/redis.conf)
sudo nano /etc/redis/redis.conf
# Set: maxmemory 192mb
# Set: maxmemory-policy allkeys-lru
# Set: appendonly yes

# Start service
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### RabbitMQ

```bash
# Add repository
curl -fsSL https://github.com/rabbitmq/signing-keys/releases/download/3.0/cloudsmith.rabbitmq-erlang.E495BB49CC4BBE5B.key | sudo apt-key add -
curl -fsSL https://github.com/rabbitmq/signing-keys/releases/download/3.0/cloudsmith.rabbitmq-rabbitmq-server.E495BB49CC4BBE5B.key | sudo apt-key add -

echo "deb https://ppa1.novemberain.com/rabbitmq/rabbitmq-erlang/ubuntu jammy main" | sudo tee /etc/apt/sources.list.d/rabbitmq.list
echo "deb https://ppa1.novemberain.com/rabbitmq-rabbitmq-server/ubuntu jammy main" | sudo tee -a /etc/apt/sources.list.d/rabbitmq.list

# Install
sudo apt-get update
sudo apt-get install -y rabbitmq-server

# Enable management plugin
sudo rabbitmq-plugins enable rabbitmq_management

# Start service
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server
```

### Advantages

✅ No Docker overhead
✅ Direct system integration
✅ Better performance (no containerization)
✅ Lower memory usage
✅ Easier debugging

### Disadvantages

⚠️ More manual configuration
⚠️ System-level dependencies
⚠️ Harder to remove/update

## Service Management

```bash
# PostgreSQL
sudo systemctl status postgresql
sudo systemctl start postgresql
sudo systemctl stop postgresql
sudo systemctl restart postgresql

# Redis
sudo systemctl status redis-server
sudo systemctl start redis-server
sudo systemctl stop redis-server
sudo systemctl restart redis-server

# RabbitMQ
sudo systemctl status rabbitmq-server
sudo systemctl start rabbitmq-server
sudo systemctl stop rabbitmq-server
sudo systemctl restart rabbitmq-server
```

## Connection Strings

### For PM2 Applications

Update `ecosystem.config.js`:

```javascript
DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/fayo'
REDIS_HOST: 'localhost'
REDIS_PORT: 6379
RABBITMQ_URL: 'amqp://guest:guest@localhost:5672'
```

## Testing Connections

### PostgreSQL

```bash
# Test connection
psql -U postgres -d fayo -c "SELECT 1;"
```

### Redis

```bash
# Test connection
redis-cli ping
# Should return: PONG
```

### RabbitMQ

```bash
# Test connection
sudo rabbitmqctl status
```

## Recommended Setup

**For Production VPS:**

- **Install Infrastructure Directly on VPS**
  - No Docker overhead
  - Better performance
  - Lower memory usage
  - Full system integration

- **Use PM2 for Applications**
  - Faster startup
  - Lower overhead
  - Better performance

This gives you maximum performance with minimal overhead.

## Troubleshooting

### PostgreSQL Connection Refused

```bash
# Check if running
sudo systemctl status postgresql

# Check port
sudo netstat -tuln | grep 5432
```

### Redis Connection Refused

```bash
# Check if running
sudo systemctl status redis-server

# Check port
sudo netstat -tuln | grep 6379
```

### RabbitMQ Connection Refused

```bash
# Check if running
sudo systemctl status rabbitmq-server

# Check ports
sudo netstat -tuln | grep 5672
sudo netstat -tuln | grep 15672
```

## Backup & Restore

```bash
# Backup PostgreSQL
pg_dump -U postgres fayo > backup.sql

# Restore PostgreSQL
psql -U postgres fayo < backup.sql
```

## Security Notes

⚠️ **Important**: Change default passwords in production!

```bash
# PostgreSQL
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'your-secure-password';"

# RabbitMQ
sudo rabbitmqctl change_password guest your-secure-password
```

Update `ecosystem.config.js` with new passwords.

