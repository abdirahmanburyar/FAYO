#!/bin/bash
# Install Infrastructure Services Directly on VPS (No Docker)
# PostgreSQL, Redis, and RabbitMQ

set -e

echo "🚀 Installing Infrastructure Services on VPS..."

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
else
    echo "❌ Cannot detect OS. This script supports Ubuntu/Debian only."
    exit 1
fi

echo "📦 Detected OS: $OS $VER"

# Update package list
echo "🔄 Updating package list..."
sudo apt-get update

# ============================================
# PostgreSQL Installation
# ============================================
echo ""
echo "🐘 Installing PostgreSQL..."

if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL is already installed"
    psql --version
else
    sudo apt-get install -y postgresql-15 postgresql-contrib-15
    
    # Start and enable PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    echo "✅ PostgreSQL installed"
fi

# Configure PostgreSQL
echo "⚙️  Configuring PostgreSQL..."

# Set password for postgres user
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" || echo "⚠️  Password already set or user doesn't exist"

# Create fayo database
sudo -u postgres psql -c "CREATE DATABASE fayo;" 2>/dev/null || echo "⚠️  Database 'fayo' already exists"

# Configure PostgreSQL for better performance (edit postgresql.conf)
PG_VERSION=$(sudo -u postgres psql -t -c "SHOW server_version_num;" | xargs)
PG_MAJOR=$(echo $PG_VERSION | cut -c1-2)

PG_CONF="/etc/postgresql/${PG_MAJOR}/main/postgresql.conf"
PG_HBA="/etc/postgresql/${PG_MAJOR}/main/pg_hba.conf"

if [ -f "$PG_CONF" ]; then
    echo "📝 Updating PostgreSQL configuration..."
    
    # Backup original config
    sudo cp "$PG_CONF" "${PG_CONF}.backup"
    
    # Update settings for low-memory VPS
    sudo sed -i "s/#shared_buffers = 128MB/shared_buffers = 128MB/" "$PG_CONF" || \
    sudo sed -i "s/shared_buffers = .*/shared_buffers = 128MB/" "$PG_CONF"
    
    sudo sed -i "s/#effective_cache_size = 4GB/effective_cache_size = 512MB/" "$PG_CONF" || \
    sudo sed -i "s/effective_cache_size = .*/effective_cache_size = 512MB/" "$PG_CONF"
    
    sudo sed -i "s/#maintenance_work_mem = 64MB/maintenance_work_mem = 64MB/" "$PG_CONF" || \
    sudo sed -i "s/maintenance_work_mem = .*/maintenance_work_mem = 64MB/" "$PG_CONF"
    
    sudo sed -i "s/#max_connections = 100/max_connections = 50/" "$PG_CONF" || \
    sudo sed -i "s/max_connections = .*/max_connections = 50/" "$PG_CONF"
    
    # Allow local connections (for PM2 apps)
    if ! grep -q "host    all             all             127.0.0.1/32            md5" "$PG_HBA"; then
        echo "host    all             all             127.0.0.1/32            md5" | sudo tee -a "$PG_HBA" > /dev/null
    fi
    
    # Restart PostgreSQL
    sudo systemctl restart postgresql
    echo "✅ PostgreSQL configured"
else
    echo "⚠️  Could not find PostgreSQL config file at $PG_CONF"
fi

# ============================================
# Redis Installation
# ============================================
echo ""
echo "🔴 Installing Redis..."

if command -v redis-server &> /dev/null; then
    echo "✅ Redis is already installed"
    redis-server --version
else
    sudo apt-get install -y redis-server
    
    # Configure Redis
    REDIS_CONF="/etc/redis/redis.conf"
    if [ -f "$REDIS_CONF" ]; then
        sudo sed -i "s/# maxmemory <bytes>/maxmemory 192mb/" "$REDIS_CONF"
        sudo sed -i "s/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/" "$REDIS_CONF"
        sudo sed -i "s/appendonly no/appendonly yes/" "$REDIS_CONF"
    fi
    
    # Start and enable Redis
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    
    echo "✅ Redis installed and configured"
fi

# ============================================
# RabbitMQ Installation
# ============================================
echo ""
echo "🐰 Installing RabbitMQ..."

if command -v rabbitmq-server &> /dev/null; then
    echo "✅ RabbitMQ is already installed"
    rabbitmq-server --version
else
    # Add RabbitMQ repository
    curl -fsSL https://github.com/rabbitmq/signing-keys/releases/download/3.0/cloudsmith.rabbitmq-erlang.E495BB49CC4BBE5B.key | sudo apt-key add -
    curl -fsSL https://github.com/rabbitmq/signing-keys/releases/download/3.0/cloudsmith.rabbitmq-rabbitmq-server.E495BB49CC4BBE5B.key | sudo apt-key add -
    
    # Add repository (for Ubuntu 22.04)
    echo "deb https://ppa1.novemberain.com/rabbitmq/rabbitmq-erlang/ubuntu jammy main" | sudo tee /etc/apt/sources.list.d/rabbitmq.list
    echo "deb https://ppa1.novemberain.com/rabbitmq/rabbitmq-server/ubuntu jammy main" | sudo tee -a /etc/apt/sources.list.d/rabbitmq.list
    
    sudo apt-get update
    sudo apt-get install -y rabbitmq-server
    
    # Enable management plugin
    sudo rabbitmq-plugins enable rabbitmq_management
    
    # Set default user (guest/guest is default, but we can change it)
    # sudo rabbitmqctl add_user admin admin123
    # sudo rabbitmqctl set_user_tags admin administrator
    # sudo rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"
    
    # Start and enable RabbitMQ
    sudo systemctl start rabbitmq-server
    sudo systemctl enable rabbitmq-server
    
    echo "✅ RabbitMQ installed"
    echo "   Management UI: http://localhost:15672"
    echo "   Default credentials: guest/guest"
fi

# ============================================
# Summary
# ============================================
echo ""
echo "✅ Infrastructure installation complete!"
echo ""
echo "📋 Service Status:"
echo "  PostgreSQL: $(sudo systemctl is-active postgresql)"
echo "  Redis:      $(sudo systemctl is-active redis-server)"
echo "  RabbitMQ:   $(sudo systemctl is-active rabbitmq-server)"
echo ""
echo "🔌 Connection Details:"
echo "  PostgreSQL: postgresql://postgres:postgres@localhost:5432/fayo"
echo "  Redis:      redis://localhost:6379"
echo "  RabbitMQ:   amqp://guest:guest@localhost:5672"
echo "  RabbitMQ UI: http://localhost:15672 (guest/guest)"
echo ""
echo "📝 Next Steps:"
echo "  1. Run database migrations:"
echo "     cd services/api-service && npx prisma migrate deploy"
echo "  2. Start applications with PM2:"
echo "     pm2 start ecosystem.config.js"
echo ""

