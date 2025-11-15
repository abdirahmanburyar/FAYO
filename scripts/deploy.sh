#!/bin/bash

# Manual deployment script for FAYO system
# This script can be used for manual deployment or as a reference

set -e

VPS_HOST="31.97.58.62"
VPS_USER="root"
VPS_PASSWORD="Buryar@2020#"
DEPLOY_DIR="/opt/fayo"

echo "=========================================="
echo "FAYO System Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run command on VPS
run_on_vps() {
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "$1"
}

# Function to copy file to VPS
copy_to_vps() {
    sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no "$1" $VPS_USER@$VPS_HOST:"$2"
}

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}Error: sshpass is not installed${NC}"
    echo "Install it with:"
    echo "  Ubuntu/Debian: sudo apt-get install sshpass"
    echo "  macOS: brew install hudochenkov/sshpass/sshpass"
    exit 1
fi

echo -e "${GREEN}Step 1: Checking Docker installation on VPS...${NC}"
run_on_vps "command -v docker || (curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh && systemctl enable docker && systemctl start docker)"

echo -e "${GREEN}Step 2: Checking Docker Compose installation...${NC}"
run_on_vps "command -v docker-compose || (curl -L 'https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)' -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose)"

echo -e "${GREEN}Step 3: Creating deployment directory...${NC}"
run_on_vps "mkdir -p $DEPLOY_DIR/services $DEPLOY_DIR/web $DEPLOY_DIR/scripts"

echo -e "${GREEN}Step 4: Copying docker-compose file...${NC}"
copy_to_vps "docker-compose.prod.yml" "$DEPLOY_DIR/"

echo -e "${GREEN}Step 5: Copying service files...${NC}"
for service in services/*/; do
    if [ -d "$service" ]; then
        service_name=$(basename "$service")
        echo "  Copying $service_name..."
        sshpass -p "$VPS_PASSWORD" rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' "$service" $VPS_USER@$VPS_HOST:$DEPLOY_DIR/services/
    fi
done

echo -e "${GREEN}Step 6: Copying web directory...${NC}"
if [ -d "web" ]; then
    sshpass -p "$VPS_PASSWORD" rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' web/ $VPS_USER@$VPS_HOST:$DEPLOY_DIR/web/
fi

echo -e "${GREEN}Step 7: Creating .env file if it doesn't exist...${NC}"
run_on_vps "cd $DEPLOY_DIR && if [ ! -f .env ]; then cat > .env << 'ENVEOF'
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/fayo?schema=public

# Redis
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_USER=guest
RABBITMQ_PASS=guest

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-CHANGE-THIS

# OTP
OTP_EXPIRES_IN=300000
OTP_LENGTH=6

# Email (configure these)
EMAIL_USER=
EMAIL_PASS=
DEFAULT_EMAIL=

# SMS (configure these)
SMS_API_KEY=
SMS_API_URL=

# Keycloak (configure these)
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=fayo
KEYCLOAK_CLIENT_ID=fayo-web
KEYCLOAK_CLIENT_SECRET=
KEYCLOAK_CALLBACK_URL=http://31.97.58.62:3006/auth/keycloak/callback

# API URLs
NEXT_PUBLIC_API_URL=http://31.97.58.62:3006
ENVEOF
fi"

echo -e "${GREEN}Step 8: Stopping existing containers...${NC}"
run_on_vps "cd $DEPLOY_DIR && docker-compose -f docker-compose.prod.yml down || true"

echo -e "${GREEN}Step 9: Building Docker images...${NC}"
run_on_vps "cd $DEPLOY_DIR && docker-compose -f docker-compose.prod.yml build --no-cache"

echo -e "${GREEN}Step 10: Starting services...${NC}"
run_on_vps "cd $DEPLOY_DIR && docker-compose -f docker-compose.prod.yml up -d"

echo -e "${GREEN}Step 11: Waiting for services to start...${NC}"
sleep 30

echo -e "${GREEN}Step 12: Checking service status...${NC}"
run_on_vps "cd $DEPLOY_DIR && docker-compose -f docker-compose.prod.yml ps"

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Services are available at:"
echo "  - Admin Panel: http://$VPS_HOST:3000"
echo "  - Gateway: http://$VPS_HOST:3006"
echo "  - User Service: http://$VPS_HOST:3001"
echo "  - Hospital Service: http://$VPS_HOST:3002"
echo "  - Doctor Service: http://$VPS_HOST:3003"
echo "  - Shared Service: http://$VPS_HOST:3004"
echo "  - Notification Worker: http://$VPS_HOST:3007"
echo ""
echo "To view logs:"
echo "  ssh $VPS_USER@$VPS_HOST 'cd $DEPLOY_DIR && docker-compose -f docker-compose.prod.yml logs -f'"
echo ""

