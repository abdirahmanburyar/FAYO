#!/bin/bash

# Automated HTTPS Setup Script for FAYO Healthcare
# This script sets up nginx with SSL for the Next.js admin panel

set -e

echo "🔐 Starting HTTPS Setup for FAYO Healthcare Admin Panel..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="${VPS_IP:-localhost}"
DOMAIN="${DOMAIN:-}"
ADMIN_PANEL_PORT=3000
NGINX_CONFIG_DIR="/etc/nginx"
SSL_DIR="/etc/nginx/ssl"
CONFIG_FILE="fayo.conf"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root or with sudo${NC}"
    exit 1
fi

# Detect OS and set config path
if [ -f /etc/redhat-release ]; then
    OS="centos"
    PKG_MANAGER="yum"
    NGINX_SERVICE="nginx"
    # CentOS/RHEL uses conf.d
    CONFIG_PATH="${NGINX_CONFIG_DIR}/conf.d/${CONFIG_FILE}"
elif [ -f /etc/debian_version ]; then
    OS="debian"
    PKG_MANAGER="apt"
    NGINX_SERVICE="nginx"
    # Debian/Ubuntu uses sites-available/sites-enabled
    SITES_AVAILABLE="${NGINX_CONFIG_DIR}/sites-available"
    SITES_ENABLED="${NGINX_CONFIG_DIR}/sites-enabled"
    CONFIG_PATH="${SITES_AVAILABLE}/${CONFIG_FILE}"
else
    echo -e "${RED}❌ Unsupported OS. This script supports CentOS/RHEL and Debian/Ubuntu${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Detected OS: $OS${NC}"
echo -e "${GREEN}📁 Config will be placed at: $CONFIG_PATH${NC}"

# Install nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}📦 Installing nginx...${NC}"
    if [ "$OS" = "centos" ]; then
        if [ -f /etc/redhat-release ] && grep -q "release 7" /etc/redhat-release; then
            yum install -y epel-release
        fi
        $PKG_MANAGER install -y nginx
    else
        $PKG_MANAGER update -y
        $PKG_MANAGER install -y nginx
    fi
    echo -e "${GREEN}✅ Nginx installed${NC}"
else
    echo -e "${GREEN}✅ Nginx already installed${NC}"
fi

# Start and enable nginx
systemctl start $NGINX_SERVICE
systemctl enable $NGINX_SERVICE

# Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    echo -e "${GREEN}✅ Firewall configured (firewalld)${NC}"
elif command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo -e "${GREEN}✅ Firewall configured (ufw)${NC}"
else
    echo -e "${YELLOW}⚠️  No firewall detected. Please manually open ports 80 and 443${NC}"
fi

# Create SSL directory
mkdir -p $SSL_DIR

# SSL Certificate Setup
if [ -n "$DOMAIN" ]; then
    echo -e "${YELLOW}🔐 Setting up Let's Encrypt SSL certificate for domain: $DOMAIN${NC}"
    
    # Install certbot
    if [ "$OS" = "centos" ]; then
        if ! command -v certbot &> /dev/null; then
            $PKG_MANAGER install -y certbot python3-certbot-nginx
        fi
    else
        if ! command -v certbot &> /dev/null; then
            $PKG_MANAGER install -y certbot python3-certbot-nginx
        fi
    fi
    
    # Get certificate
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || {
        echo -e "${RED}❌ Failed to obtain Let's Encrypt certificate${NC}"
        echo -e "${YELLOW}⚠️  Falling back to self-signed certificate${NC}"
        DOMAIN=""
    }
    
    if [ -n "$DOMAIN" ]; then
        SSL_CERT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
        SSL_KEY="/etc/letsencrypt/live/$DOMAIN/privkey.pem"
        echo -e "${GREEN}✅ Let's Encrypt certificate obtained${NC}"
    fi
fi

# Generate self-signed certificate if no domain or Let's Encrypt failed
if [ -z "$DOMAIN" ] || [ ! -f "$SSL_CERT" ]; then
    echo -e "${YELLOW}🔐 Generating self-signed SSL certificate...${NC}"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout $SSL_DIR/privkey.pem \
        -out $SSL_DIR/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=FAYO/CN=$VPS_IP" 2>/dev/null || {
        echo -e "${RED}❌ Failed to generate self-signed certificate${NC}"
        exit 1
    }
    
    chmod 600 $SSL_DIR/privkey.pem
    chmod 644 $SSL_DIR/fullchain.pem
    SSL_CERT="$SSL_DIR/fullchain.pem"
    SSL_KEY="$SSL_DIR/privkey.pem"
    echo -e "${GREEN}✅ Self-signed certificate generated${NC}"
fi

# Create nginx configuration
echo -e "${YELLOW}📝 Creating nginx configuration...${NC}"

# For Debian/Ubuntu, create sites-available and sites-enabled directories if they don't exist
if [ "$OS" = "debian" ]; then
    mkdir -p $SITES_AVAILABLE
    mkdir -p $SITES_ENABLED
fi

# Determine server name
SERVER_NAME="${DOMAIN:-$VPS_IP}"

cat > $CONFIG_PATH <<EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name $SERVER_NAME;

    # Redirect all HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server - Admin Panel Only
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $SERVER_NAME;

    # SSL Configuration
    ssl_certificate $SSL_CERT;
    ssl_certificate_key $SSL_KEY;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Increase body size for file uploads
    client_max_body_size 50M;

    # API Proxy Routes - Proxy backend services via HTTPS to avoid mixed content
    # User Service (port 3001)
    location /api/user-service/ {
        proxy_pass http://72.62.51.50:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Hospital Service (port 3002)
    location /api/hospital-service/ {
        proxy_pass http://localhost:3002/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Doctor Service (port 3003)
    location /api/doctor-service/ {
        proxy_pass http://localhost:3003/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # shared-service and call-service have been removed
    }

    # Admin Panel (Next.js) - Only proxy the admin panel
    location / {
        proxy_pass http://localhost:$ADMIN_PANEL_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Enable site (only for Debian/Ubuntu - CentOS uses conf.d directly)
if [ "$OS" = "debian" ]; then
    if [ -L $SITES_ENABLED/$CONFIG_FILE ]; then
        rm $SITES_ENABLED/$CONFIG_FILE
    fi
    ln -s $SITES_AVAILABLE/$CONFIG_FILE $SITES_ENABLED/$CONFIG_FILE
    
    # Remove default site if exists
    if [ -f $SITES_ENABLED/default ]; then
        rm $SITES_ENABLED/default
    fi
else
    # CentOS: config is already in conf.d, which is auto-included
    echo -e "${GREEN}✅ Configuration placed in conf.d (auto-included)${NC}"
fi

# Test nginx configuration
echo -e "${YELLOW}🧪 Testing nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    exit 1
fi

# Reload nginx
systemctl reload $NGINX_SERVICE
echo -e "${GREEN}✅ Nginx reloaded${NC}"

# Setup auto-renewal for Let's Encrypt
if [ -n "$DOMAIN" ] && command -v certbot &> /dev/null; then
    echo -e "${YELLOW}🔄 Setting up certificate auto-renewal...${NC}"
    # Certbot already sets up auto-renewal, but let's verify
    certbot renew --dry-run > /dev/null 2>&1 && {
        echo -e "${GREEN}✅ Certificate auto-renewal configured${NC}"
    } || {
        echo -e "${YELLOW}⚠️  Certificate auto-renewal test failed (may need manual setup)${NC}"
    }
fi

# Summary
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ HTTPS Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Admin Panel URL: ${GREEN}https://$SERVER_NAME${NC}"
echo -e "SSL Certificate: ${GREEN}$SSL_CERT${NC}"
echo ""
if [ -z "$DOMAIN" ]; then
    echo -e "${YELLOW}⚠️  Using self-signed certificate${NC}"
    echo -e "${YELLOW}   Browsers will show a security warning${NC}"
    echo -e "${YELLOW}   For production, use a domain name with Let's Encrypt${NC}"
    echo ""
    echo -e "To use Let's Encrypt, run:"
    echo -e "${GREEN}DOMAIN=yourdomain.com ./setup-https.sh${NC}"
else
    echo -e "${GREEN}✅ Using Let's Encrypt certificate${NC}"
    echo -e "${GREEN}   Certificate will auto-renew${NC}"
fi
echo ""
echo -e "Nginx Status: ${GREEN}$(systemctl is-active $NGINX_SERVICE)${NC}"
if [ "$OS" = "debian" ]; then
    echo -e "Nginx Config: ${GREEN}$SITES_ENABLED/$CONFIG_FILE${NC}"
else
    echo -e "Nginx Config: ${GREEN}$CONFIG_PATH${NC}"
fi
echo ""

