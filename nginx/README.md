# Nginx HTTPS Configuration for FAYO Healthcare

This directory contains the nginx configuration for setting up HTTPS with SSL certificates.

## 📋 Prerequisites

- Nginx installed on your VPS
  - **Ubuntu/Debian**: See installation steps below
  - **CentOS/Rocky Linux**: See `INSTALL_CENTOS.md` for detailed CentOS instructions
- Domain name pointing to your VPS IP (72.62.51.50) - Optional but recommended for Let's Encrypt
- Root or sudo access to the VPS

## 🚀 Quick Installation

### For Ubuntu/Debian:
```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### For CentOS/Rocky Linux:
See detailed instructions in `INSTALL_CENTOS.md`

## 🔐 SSL Certificate Setup

### Option 1: Let's Encrypt (Recommended - Free SSL)

1. **Install Certbot:**
   ```bash
   sudo apt update
   sudo apt install certbot python3-certbot-nginx -y
   ```

2. **Get SSL Certificate:**
   ```bash
   # If you have a domain name
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   
   # Or for IP-based certificate (requires manual setup)
   # Note: Let's Encrypt doesn't issue certificates for IP addresses directly
   # You'll need a domain name
   ```

3. **Auto-renewal:**
   Certbot sets up auto-renewal automatically. Test it:
   ```bash
   sudo certbot renew --dry-run
   ```

### Option 2: Self-Signed Certificate (For Testing)

1. **Create SSL directory:**
   ```bash
   sudo mkdir -p /etc/nginx/ssl
   ```

2. **Generate self-signed certificate:**
   ```bash
   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout /etc/nginx/ssl/privkey.pem \
     -out /etc/nginx/ssl/fullchain.pem \
     -subj "/C=US/ST=State/L=City/O=FAYO/CN=72.62.51.50"
   ```

3. **Set permissions:**
   ```bash
   sudo chmod 600 /etc/nginx/ssl/privkey.pem
   sudo chmod 644 /etc/nginx/ssl/fullchain.pem
   ```

## 🚀 Installation Steps

1. **Copy nginx configuration:**
   ```bash
   sudo cp nginx/nginx.conf /etc/nginx/sites-available/fayo
   sudo ln -s /etc/nginx/sites-available/fayo /etc/nginx/sites-enabled/
   ```

2. **Remove default nginx site (optional):**
   ```bash
   sudo rm /etc/nginx/sites-enabled/default
   ```

3. **Test nginx configuration:**
   ```bash
   sudo nginx -t
   ```

4. **Reload nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

5. **Enable nginx to start on boot:**
   ```bash
   sudo systemctl enable nginx
   ```

## 🔧 Configuration Details

### Ports Mapped:
- **HTTPS (443)**: Admin Panel only (SSL termination)
- **HTTP (80)**: Redirects to HTTPS for admin panel

### Services Access:
- **Admin Panel**: `https://72.62.51.50` (via nginx SSL)
- **User Service**: `http://72.62.51.50:3001` (direct access)
- **Hospital Service**: `http://72.62.51.50:3002` (direct access)
- **Doctor Service**: `http://72.62.51.50:3003` (direct access)
- **Shared Service**: `http://72.62.51.50:3004` (direct access)
- **Call Service**: `http://72.62.51.50:3010` (direct access)

**Note**: This configuration only provides SSL for the admin panel. All backend services are accessed directly via HTTP on their respective ports.

## 🔄 Application URLs

**Important**: This configuration only provides SSL for the admin panel. All backend services continue to use HTTP on their direct ports.

1. **Admin Panel** - Access via `https://72.62.51.50` (nginx provides SSL)
2. **Backend Services** - Access directly via `http://72.62.51.50:PORT` (no SSL, direct access)
3. **Flutter App** - Uses direct HTTP connections to services

**Note**: For production with full HTTPS, you would need to either:
- Use nginx as a reverse proxy for all services (more complex)
- Or configure each service to handle SSL directly (requires certificates for each service)

## 🛠️ Troubleshooting

### Check nginx status:
```bash
sudo systemctl status nginx
```

### View nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Test SSL certificate:
```bash
openssl s_client -connect 72.62.51.50:443 -servername 72.62.51.50
```

### Check if ports are open:
```bash
sudo netstat -tlnp | grep :443
sudo netstat -tlnp | grep :80
```

## 🔒 Security Notes

1. **Firewall Configuration:**
   ```bash
   # Allow HTTP and HTTPS
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   
   # Optionally close direct access to service ports
   # (Only if you want to access services only through nginx)
   ```

2. **Regular Updates:**
   ```bash
   sudo apt update && sudo apt upgrade nginx -y
   ```

3. **Certificate Renewal:**
   - Let's Encrypt certificates expire every 90 days
   - Certbot auto-renewal should handle this
   - Check renewal: `sudo certbot certificates`

## 📝 Notes

- If using IP address only (no domain), you'll need to use a self-signed certificate
- Browsers will show a security warning for self-signed certificates
- For production, use a domain name with Let's Encrypt
- The configuration includes WebSocket support for Socket.IO

