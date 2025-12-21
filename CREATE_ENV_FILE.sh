#!/bin/bash
# Quick script to create .env file for api-service
# Run: ./CREATE_ENV_FILE.sh

cd services/api-service

if [ -f .env ]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup"
    cp .env .env.backup
fi

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

# Zoom Configuration (optional)
ZOOM_SDK_KEY=
ZOOM_SDK_SECRET=

# Payment Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://72.62.51.50:3000
ADMIN_PANEL_URL=http://localhost:3000

# Waafipay Configuration
WAAFIPAY_ENV=sandbox
WAAFIPAY_API_URL=https://api.waafipay.com/asm
WAAFIPAY_MERCHANT_UID=M0913664
WAAFIPAY_API_USER_ID=1007468
WAAFIPAY_API_KEY=API-1101188487AHX
WAAFIPAY_ACCOUNT_NUMBER=
WAAFIPAY_PHONE_NUMBER=
EOF

echo "✅ Created .env file at services/api-service/.env"
echo ""
echo "📋 Next steps:"
echo "  1. Review and edit .env if needed:"
echo "     nano services/api-service/.env"
echo ""
echo "  2. Run Prisma migrations:"
echo "     cd services/api-service && npx prisma migrate deploy"
echo ""

