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
    # Add PostgreSQL official APT repository
    echo "📦 Adding PostgreSQL repository..."
    
    # Install prerequisites
    sudo apt-get install -y wget ca-certificates lsb-release
    
    # Detect Ubuntu codename
    UBUNTU_CODENAME=$(lsb_release -cs 2>/dev/null || echo "jammy")
    echo "📋 Detected Ubuntu codename: $UBUNTU_CODENAME"
    
    # Add PostgreSQL signing key (new method for newer systems)
    if command -v gpg &> /dev/null && [ -d /etc/apt/keyrings ] || mkdir -p /etc/apt/keyrings 2>/dev/null; then
        # New method (Ubuntu 22.04+) - preferred
        echo "🔑 Using new GPG key method..."
        sudo mkdir -p /etc/apt/keyrings
        wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/keyrings/postgresql.gpg
        sudo sh -c "echo 'deb [signed-by=/etc/apt/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt ${UBUNTU_CODENAME}-pgdg main' > /etc/apt/sources.list.d/pgdg.list"
    else
        # Fallback to old method (for older Ubuntu versions)
        echo "🔑 Using legacy apt-key method..."
        wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
        sudo sh -c "echo 'deb http://apt.postgresql.org/pub/repos/apt ${UBUNTU_CODENAME}-pgdg main' > /etc/apt/sources.list.d/pgdg.list"
    fi
    
    # Update package list
    echo "🔄 Updating package list..."
    sudo apt-get update
    
    # Install PostgreSQL 15
    echo "📦 Installing PostgreSQL 15..."
    sudo apt-get install -y postgresql-15 postgresql-contrib-15
    
    # Start and enable PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    echo "✅ PostgreSQL installed"
fi

# Configure PostgreSQL
echo "⚙️  Configuring PostgreSQL..."

# Set password for postgres user (change to home directory first to avoid permission errors)
sudo -u postgres sh -c "cd ~ && psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\"" || echo "⚠️  Password already set or user doesn't exist"

# Create fayo database
sudo -u postgres sh -c "cd ~ && psql -c 'CREATE DATABASE fayo;'" 2>/dev/null || echo "⚠️  Database 'fayo' already exists"

# Configure PostgreSQL for better performance (edit postgresql.conf)
PG_VERSION=$(sudo -u postgres sh -c "cd ~ && psql -t -c 'SHOW server_version_num;'" | xargs)
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
    # Detect Ubuntu codename
    UBUNTU_CODENAME=$(lsb_release -cs 2>/dev/null || echo "jammy")
    echo "📋 Detected Ubuntu codename: $UBUNTU_CODENAME"
    
    # Add RabbitMQ repository using new GPG method
    echo "📦 Adding RabbitMQ repository..."
    
    # Create keyrings directory
    sudo mkdir -p /etc/apt/keyrings
    
    # Try installing from default Ubuntu repositories first (simpler)
    echo "📦 Attempting to install RabbitMQ from Ubuntu repositories..."
    if sudo apt-get install -y rabbitmq-server 2>/dev/null; then
        echo "✅ RabbitMQ installed from Ubuntu repositories"
    else
        echo "⚠️  RabbitMQ not in default repos, trying official repository..."
        
        # Download and add RabbitMQ GPG keys using official method
        echo "🔑 Adding RabbitMQ GPG keys..."
        
        # Try downloading keys directly
        sudo mkdir -p /etc/apt/keyrings
        
        # Download Erlang key
        if curl -fsSL "https://keys.openpgp.org/vks/v1/by-fingerprint/0A9AF2115F4687BD29803A206B73A36E6026DFCA" -o /tmp/rabbitmq-key.asc 2>/dev/null || \
           wget --quiet -O /tmp/rabbitmq-key.asc "https://keys.openpgp.org/vks/v1/by-fingerprint/0A9AF2115F4687BD29803A206B73A36E6026DFCA" 2>/dev/null; then
            if grep -q "BEGIN PGP" /tmp/rabbitmq-key.asc 2>/dev/null; then
                sudo gpg --dearmor < /tmp/rabbitmq-key.asc > /etc/apt/keyrings/rabbitmq.gpg
                rm -f /tmp/rabbitmq-key.asc
                echo "✅ RabbitMQ GPG key added"
            else
                echo "⚠️  Invalid GPG key format"
                rm -f /tmp/rabbitmq-key.asc
            fi
        else
            echo "⚠️  Could not download GPG key, trying alternative installation method..."
            # Install Erlang first, then RabbitMQ
            sudo apt-get install -y erlang erlang-nox
            wget -O /tmp/rabbitmq-server.deb https://github.com/rabbitmq/rabbitmq-server/releases/download/v3.13.0/rabbitmq-server_3.13.0-1_all.deb 2>/dev/null || \
            echo "⚠️  Could not download RabbitMQ package"
            if [ -f /tmp/rabbitmq-server.deb ]; then
                sudo dpkg -i /tmp/rabbitmq-server.deb
                sudo apt-get install -f -y
                rm -f /tmp/rabbitmq-server.deb
                echo "✅ RabbitMQ installed from package"
            fi
        fi
        
        # Add repository if key was added successfully
        if [ -f /etc/apt/keyrings/rabbitmq.gpg ]; then
            echo "deb [signed-by=/etc/apt/keyrings/rabbitmq.gpg] https://ppa1.novemberain.com/rabbitmq/rabbitmq-erlang/ubuntu ${UBUNTU_CODENAME} main" | sudo tee /etc/apt/sources.list.d/rabbitmq.list
            echo "deb [signed-by=/etc/apt/keyrings/rabbitmq.gpg] https://ppa1.novemberain.com/rabbitmq/rabbitmq-server/ubuntu ${UBUNTU_CODENAME} main" | sudo tee -a /etc/apt/sources.list.d/rabbitmq.list
            sudo apt-get update
            sudo apt-get install -y rabbitmq-server
        fi
    fi
    
    # Add repositories with signed-by
    echo "deb [signed-by=/etc/apt/keyrings/rabbitmq-erlang.gpg] https://ppa1.novemberain.com/rabbitmq/rabbitmq-erlang/ubuntu ${UBUNTU_CODENAME} main" | sudo tee /etc/apt/sources.list.d/rabbitmq.list
    echo "deb [signed-by=/etc/apt/keyrings/rabbitmq-server.gpg] https://ppa1.novemberain.com/rabbitmq/rabbitmq-server/ubuntu ${UBUNTU_CODENAME} main" | sudo tee -a /etc/apt/sources.list.d/rabbitmq.list
    
    # Update package list
    echo "🔄 Updating package list..."
    sudo apt-get update
    
    # Install RabbitMQ
    echo "📦 Installing RabbitMQ..."
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

