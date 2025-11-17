# Installing Nginx on CentOS VPS

This guide covers installing and configuring nginx on CentOS for FAYO Healthcare.

## 📋 Prerequisites

- CentOS 7/8/9 or Rocky Linux / AlmaLinux
- Root or sudo access
- VPS IP: 31.97.58.62

## 🚀 Installation Steps

### 1. Update System

```bash
sudo yum update -y
# Or for CentOS 8+ / Rocky Linux / AlmaLinux:
sudo dnf update -y
```

### 2. Install Nginx

**For CentOS 7:**
```bash
sudo yum install epel-release -y
sudo yum install nginx -y
```

**For CentOS 8+ / Rocky Linux / AlmaLinux:**
```bash
sudo dnf install nginx -y
```

### 3. Start and Enable Nginx

```bash
# Start nginx
sudo systemctl start nginx

# Enable nginx to start on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### 4. Configure Firewall

**For firewalld (default on CentOS):**
```bash
# Check if firewalld is running
sudo systemctl status firewalld

# If running, allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-all
```

**For iptables (if using instead):**
```bash
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo service iptables save
```

### 5. Test Nginx Installation

```bash
# Test nginx configuration
sudo nginx -t

# If successful, you should see:
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Visit `http://31.97.58.62` in your browser. You should see the default nginx welcome page.

## 🔐 SSL Certificate Setup

### Option 1: Let's Encrypt (Recommended - Free SSL)

**Prerequisites:**
- Domain name pointing to your VPS IP (31.97.58.62)
- Ports 80 and 443 open

**Install Certbot:**
```bash
# For CentOS 7
sudo yum install certbot python3-certbot-nginx -y

# For CentOS 8+ / Rocky Linux / AlmaLinux
sudo dnf install certbot python3-certbot-nginx -y
```

**Get SSL Certificate:**
```bash
# Replace 'yourdomain.com' with your actual domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Auto-renewal:**
Certbot sets up auto-renewal automatically. Test it:
```bash
sudo certbot renew --dry-run
```

### Option 2: Self-Signed Certificate (For Testing)

**Create SSL directory:**
```bash
sudo mkdir -p /etc/nginx/ssl
```

**Generate self-signed certificate:**
```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/privkey.pem \
  -out /etc/nginx/ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=FAYO/CN=31.97.58.62"
```

**Set permissions:**
```bash
sudo chmod 600 /etc/nginx/ssl/privkey.pem
sudo chmod 644 /etc/nginx/ssl/fullchain.pem
```

## 📝 Deploy FAYO Configuration

### 1. Backup Default Configuration

```bash
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
```

### 2. Copy FAYO Configuration

**Option A: Copy the entire config file**
```bash
# Upload nginx/nginx.conf to your VPS, then:
sudo cp nginx.conf /etc/nginx/conf.d/fayo.conf
```

**Option B: Edit directly**
```bash
sudo nano /etc/nginx/conf.d/fayo.conf
# Paste the contents of nginx/nginx.conf
```

### 3. Update Main Nginx Config (if needed)

Check if `/etc/nginx/nginx.conf` includes configs from `conf.d`:
```bash
sudo grep -r "include.*conf.d" /etc/nginx/nginx.conf
```

If not found, add this line inside the `http` block:
```nginx
include /etc/nginx/conf.d/*.conf;
```

### 4. Remove or Disable Default Site

```bash
# Remove default server block if it exists
sudo rm /etc/nginx/conf.d/default.conf
# Or comment it out in nginx.conf
```

### 5. Test and Reload

```bash
# Test configuration
sudo nginx -t

# If successful, reload nginx
sudo systemctl reload nginx

# Or restart if needed
sudo systemctl restart nginx
```

## 🔧 Nginx Management Commands

```bash
# Start nginx
sudo systemctl start nginx

# Stop nginx
sudo systemctl stop nginx

# Restart nginx
sudo systemctl restart nginx

# Reload configuration (without downtime)
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View nginx version
nginx -v
```

## 📊 View Logs

```bash
# Error logs
sudo tail -f /var/log/nginx/error.log

# Access logs
sudo tail -f /var/log/nginx/access.log

# All logs
sudo journalctl -u nginx -f
```

## 🛠️ Troubleshooting

### Nginx won't start

```bash
# Check for errors
sudo nginx -t

# Check if port 80/443 is already in use
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Check nginx status
sudo systemctl status nginx
```

### Permission denied errors

```bash
# Check SELinux status
sudo getenforce

# If SELinux is enforcing, allow nginx to connect
sudo setsebool -P httpd_can_network_connect 1
```

### Firewall blocking connections

```bash
# Check firewall status
sudo firewall-cmd --list-all

# Allow services
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### Test SSL certificate

```bash
# Test SSL connection
openssl s_client -connect 31.97.58.62:443 -servername 31.97.58.62

# Check certificate expiration (Let's Encrypt)
sudo certbot certificates
```

## 🔒 Security Recommendations

1. **Keep nginx updated:**
   ```bash
   sudo yum update nginx -y
   # Or
   sudo dnf update nginx -y
   ```

2. **Configure SELinux (if enabled):**
   ```bash
   # Allow nginx to connect to backend services
   sudo setsebool -P httpd_can_network_connect 1
   ```

3. **Restrict access (optional):**
   ```bash
   # Only allow specific IPs (example)
   # Add to nginx config:
   # allow 192.168.1.0/24;
   # deny all;
   ```

4. **Regular backups:**
   ```bash
   # Backup nginx config
   sudo cp -r /etc/nginx /root/nginx-backup-$(date +%Y%m%d)
   ```

## 📝 Quick Reference

### File Locations (CentOS)
- **Main config**: `/etc/nginx/nginx.conf`
- **Site configs**: `/etc/nginx/conf.d/`
- **SSL certificates**: `/etc/nginx/ssl/` (custom location)
- **Let's Encrypt certs**: `/etc/letsencrypt/live/yourdomain.com/`
- **Error logs**: `/var/log/nginx/error.log`
- **Access logs**: `/var/log/nginx/access.log`
- **PID file**: `/var/run/nginx.pid`

### Service Management
```bash
# Systemd service name
systemctl [start|stop|restart|reload|status] nginx
```

### Common Issues

1. **"Address already in use"**: Another service is using port 80/443
2. **"Permission denied"**: Check SELinux and file permissions
3. **"502 Bad Gateway"**: Backend service (port 3000) not running
4. **SSL errors**: Certificate path incorrect or expired

## ✅ Verification Checklist

After installation, verify:

- [ ] Nginx is running: `sudo systemctl status nginx`
- [ ] Configuration is valid: `sudo nginx -t`
- [ ] HTTP redirects to HTTPS: Visit `http://31.97.58.62`
- [ ] HTTPS works: Visit `https://31.97.58.62`
- [ ] Admin panel accessible: `https://31.97.58.62`
- [ ] SSL certificate valid (no browser warnings for Let's Encrypt)
- [ ] Firewall allows ports 80 and 443
- [ ] Logs show no errors: `sudo tail /var/log/nginx/error.log`

## 🎯 Next Steps

After nginx is installed and configured:

1. **Test the admin panel**: `https://31.97.58.62`
2. **Verify backend services** are running on their ports
3. **Test video calling** from admin panel
4. **Monitor logs** for any issues

For more details, see `nginx/README.md`

