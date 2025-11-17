# Quick Nginx HTTPS Setup for FAYO Admin Panel

## For CentOS/RHEL

If the automated script fails, you can manually set up nginx:

### 1. Install Nginx (if not installed)
```bash
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Create SSL Directory
```bash
sudo mkdir -p /etc/nginx/ssl
```

### 3. Generate Self-Signed Certificate
```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/privkey.pem \
  -out /etc/nginx/ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=FAYO/CN=31.97.58.62"
```

### 4. Create Nginx Config
```bash
sudo nano /etc/nginx/conf.d/fayo.conf
```

Paste this configuration:
```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name 31.97.58.62;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server - Admin Panel Only
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name 31.97.58.62;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
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

    # Admin Panel (Next.js) - Proxy to localhost:3000
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 5. Test and Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Configure Firewall
```bash
# If using firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Or if using iptables
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### 7. Verify HTTPS is Working
1. Open browser and go to: `https://31.97.58.62`
2. You'll see a security warning (self-signed cert) - click "Advanced" → "Proceed"
3. The admin panel should load over HTTPS

## Important Notes

- **Always use HTTPS** for the admin panel: `https://31.97.58.62` (not `http://`)
- Browsers require HTTPS for `getUserMedia` (camera/microphone access)
- Self-signed certificates will show a warning - this is normal for development
- For production, use Let's Encrypt with a domain name

## Troubleshooting

### Check if nginx is running:
```bash
sudo systemctl status nginx
```

### Check nginx error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

### Check if admin panel is running on port 3000:
```bash
curl http://localhost:3000
```

### Verify SSL certificate:
```bash
sudo openssl x509 -in /etc/nginx/ssl/fullchain.pem -text -noout
```

