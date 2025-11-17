# Deployment Scripts

This directory contains automation scripts for deploying and configuring the FAYO Healthcare system.

## 📋 Available Scripts

### `setup-https.sh`

Automated HTTPS setup script for the Next.js admin panel using nginx.

**Features:**
- Automatically installs nginx (CentOS/RHEL or Debian/Ubuntu)
- Configures firewall (firewalld or ufw)
- Sets up SSL certificates:
  - Let's Encrypt (if domain provided)
  - Self-signed (if no domain)
- Configures nginx as reverse proxy for admin panel
- Sets up automatic certificate renewal (Let's Encrypt)

**Usage:**

```bash
# With domain (Let's Encrypt)
DOMAIN=yourdomain.com ./scripts/setup-https.sh

# Without domain (self-signed)
./scripts/setup-https.sh

# With custom IP
VPS_IP=31.97.58.62 ./scripts/setup-https.sh
```

**Requirements:**
- Root or sudo access
- Ports 80 and 443 open
- Domain pointing to VPS (for Let's Encrypt)

**What it does:**
1. Detects OS (CentOS/RHEL or Debian/Ubuntu)
2. Installs nginx if not present
3. Configures firewall
4. Generates/obtains SSL certificate
5. Creates nginx configuration
6. Tests and reloads nginx
7. Sets up auto-renewal (Let's Encrypt)

**Manual execution on VPS:**

```bash
ssh root@31.97.58.62
cd /opt/fayo
chmod +x scripts/setup-https.sh
DOMAIN=yourdomain.com ./scripts/setup-https.sh
```

## 🔄 Automatic Execution

The `setup-https.sh` script is automatically executed during CI/CD deployment if:
- Script exists in the repository
- HTTPS is not already configured
- Deployment succeeds

To skip automatic HTTPS setup, the script checks if `/etc/nginx/sites-enabled/fayo` already exists.

## 🔐 SSL Certificate Options

### Option 1: Let's Encrypt (Recommended)

**Requirements:**
- Domain name pointing to VPS
- Ports 80 and 443 accessible
- Email address (for certificate notifications)

**Setup:**
```bash
DOMAIN=yourdomain.com ./scripts/setup-https.sh
```

**Benefits:**
- Free SSL certificate
- Automatic renewal
- Trusted by browsers
- No security warnings

### Option 2: Self-Signed Certificate

**When to use:**
- No domain name available
- Testing/development
- Internal network only

**Setup:**
```bash
./scripts/setup-https.sh
```

**Note:**
- Browsers will show security warning
- Users need to click "Advanced" → "Proceed"
- Not suitable for production

## 📝 Configuration

The script creates nginx configuration at:
- `/etc/nginx/sites-available/fayo`
- `/etc/nginx/sites-enabled/fayo` (symlink)

SSL certificates are stored at:
- Let's Encrypt: `/etc/letsencrypt/live/{domain}/`
- Self-signed: `/etc/nginx/ssl/`

## 🔧 Troubleshooting

### Script fails to install nginx

```bash
# CentOS/RHEL
sudo yum install epel-release -y
sudo yum install nginx -y

# Debian/Ubuntu
sudo apt update
sudo apt install nginx -y
```

### Certificate generation fails

```bash
# Check if ports are open
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Check firewall
sudo firewall-cmd --list-all  # CentOS
sudo ufw status              # Ubuntu
```

### Nginx configuration test fails

```bash
sudo nginx -t
# Fix any errors shown
sudo nginx -t
```

### Let's Encrypt certificate renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew
sudo systemctl reload nginx
```

## 📚 Related Documentation

- `nginx/README.md` - Nginx configuration details
- `nginx/INSTALL_CENTOS.md` - Manual CentOS installation guide
- `.github/workflows/deploy.yml` - CI/CD deployment workflow

