# Start Only Admin Panel with PM2

## Quick Start

```bash
# Start only admin-panel
pm2 start ecosystem.config.js --only fayo-admin-panel
```

## Alternative Methods

### Method 1: Using PM2 start with app name
```bash
pm2 start ecosystem.config.js --only fayo-admin-panel
```

### Method 2: Start from ecosystem config (only admin-panel)
```bash
pm2 start ecosystem.config.js --only fayo-admin-panel
```

### Method 3: If already started, restart it
```bash
pm2 restart fayo-admin-panel
```

## Check Status

```bash
# Check if admin-panel is running
pm2 status

# View admin-panel logs
pm2 logs fayo-admin-panel

# Monitor admin-panel
pm2 monit fayo-admin-panel
```

## Stop Admin Panel

```bash
pm2 stop fayo-admin-panel
```

## Delete Admin Panel from PM2

```bash
pm2 delete fayo-admin-panel
```

## Verify It's Running

```bash
# Check status
pm2 status

# Test the service
curl http://localhost:3000/api/health

# Or access in browser
# http://72.62.51.50:3000
```

