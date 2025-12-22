#!/bin/bash
# Setup script for PM2 deployment (no Docker)
# Run this on your VPS

set -e

echo "🚀 Setting up FAYO Application with PM2..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 22.17.1 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "❌ Node.js version 22 or higher is required. Current: $(node -v)"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
else
    echo "✅ PM2 is already installed"
fi

# Create logs directory
mkdir -p logs
echo "✅ Created logs directory"

# Install dependencies for api-service
echo "📦 Installing api-service dependencies..."
cd services/api-service
if [ -f package-lock.json ]; then
    npm ci --legacy-peer-deps --no-audit --no-fund
else
    npm install --legacy-peer-deps --no-audit --no-fund
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file for api-service..."
    cat > .env << 'EOF'
# Database Configuration - Direct PostgreSQL installation
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fayo?schema=public&schema=users&schema=hospitals&schema=appointments&schema=payments&schema=ads"

# Redis Configuration - Direct Redis installation
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ Configuration - Direct RabbitMQ installation
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# OTP Configuration
OTP_EXPIRES_IN=300000
OTP_LENGTH=6

# Email Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=buryar313@gmail.com
MAIL_PASSWORD=fjmnakpupnytzsah
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=buryar313@gmail.com
MAIL_FROM_NAME=FAYO Healthcare
DEFAULT_EMAIL=buryar313@gmail.com

# Server Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build api-service
echo "🔨 Building api-service..."
npm run build

cd ../..

# Install dependencies for admin-panel
echo "📦 Installing admin-panel dependencies..."
cd web/admin-panel
if [ -f package-lock.json ]; then
    npm ci --legacy-peer-deps --no-audit --no-fund
else
    npm install --legacy-peer-deps --no-audit --no-fund
fi

# Install critters if not already installed (needed for optimizeCss)
if ! npm list critters &>/dev/null; then
    echo "📦 Installing critters (required for CSS optimization)..."
    npm install --save-dev critters --legacy-peer-deps --no-audit --no-fund
fi

# Build admin-panel
echo "🔨 Building admin-panel..."
NODE_OPTIONS="--max-old-space-size=3072" npm run build

cd ../..

# Install dependencies for hospital-panel
echo "📦 Installing hospital-panel dependencies..."
cd web/hospital-panel
if [ -f package-lock.json ]; then
    npm ci --legacy-peer-deps --no-audit --no-fund
else
    npm install --legacy-peer-deps --no-audit --no-fund
fi

# Install critters if not already installed (needed for optimizeCss)
if ! npm list critters &>/dev/null; then
    echo "📦 Installing critters (required for CSS optimization)..."
    npm install --save-dev critters --legacy-peer-deps --no-audit --no-fund
fi

# Build hospital-panel
echo "🔨 Building hospital-panel..."
NODE_OPTIONS="--max-old-space-size=3072" npm run build

cd ../..

# Create uploads directories
echo "📁 Creating upload directories..."
mkdir -p services/api-service/uploads/{ads,doctors,hospitals,users}
chmod -R 755 services/api-service/uploads

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Ensure PostgreSQL, Redis, and RabbitMQ are running"
echo "  2. Run database migrations:"
echo "     cd services/api-service && npx prisma migrate deploy"
echo "  3. Start services with PM2:"
echo "     pm2 start ecosystem.config.js"
echo "  4. Save PM2 configuration:"
echo "     pm2 save"
echo "  5. Setup PM2 to start on boot:"
echo "     pm2 startup"
echo ""

