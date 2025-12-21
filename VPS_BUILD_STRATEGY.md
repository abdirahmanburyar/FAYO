# VPS Build Strategy - Resource-Constrained Environment

## The Reality

Your VPS has:
- Limited CPU (competing with systemd-bench at 639% CPU)
- Limited memory
- Limited disk I/O
- Slow network to npm registry

Building on a resource-constrained VPS will always be slow.

## Best Solutions for VPS

### Solution 1: Build Locally and Transfer (RECOMMENDED)

**On your local machine (Windows/Mac/Linux):**

```bash
# Navigate to project
cd C:\FAYO\web\admin-panel

# Build the image
docker build -t admin-panel:latest .

# Save as compressed tar
docker save admin-panel:latest | gzip > admin-panel.tar.gz

# Transfer to VPS (replace with your VPS details)
scp admin-panel.tar.gz root@72.62.51.50:/root/fayo/
```

**On your VPS:**

```bash
cd /root/fayo

# Load the image
gunzip -c admin-panel.tar.gz | docker load

# Tag it properly
docker tag admin-panel:latest fayo-admin-panel:latest

# Update docker-compose to use the image instead of building
# Or just use: docker compose up -d
```

**Update docker-compose.prod.yml:**

```yaml
admin-panel:
  # Comment out build, use image instead
  # build:
  #   context: ./web/admin-panel
  #   dockerfile: Dockerfile
  image: fayo-admin-panel:latest  # Use pre-built image
  container_name: admin-panel
  # ... rest of config
```

### Solution 2: Use Docker Hub (Free Registry)

**On your local machine:**

```bash
# Login to Docker Hub
docker login

# Build and tag
cd C:\FAYO\web\admin-panel
docker build -t yourusername/fayo-admin-panel:latest .

# Push to Docker Hub
docker push yourusername/fayo-admin-panel:latest
```

**On your VPS:**

```yaml
# In docker-compose.prod.yml
admin-panel:
  image: yourusername/fayo-admin-panel:latest  # Pull from registry
  # Remove build section
```

Then on VPS:
```bash
docker pull yourusername/fayo-admin-panel:latest
docker compose -f docker-compose.prod.yml up -d admin-panel
```

### Solution 3: Optimize VPS During Build

If you must build on VPS:

```bash
# 1. Stop unnecessary services temporarily
sudo systemctl stop systemd-bench  # If safe to stop
sudo systemctl stop monarx-agent   # If safe to stop

# 2. Stop other containers
docker compose -f docker-compose.prod.yml stop

# 3. Build with lower priority (won't interfere)
nice -n 19 ionice -c 3 docker compose -f docker-compose.prod.yml build admin-panel

# 4. Restart services
sudo systemctl start systemd-bench
sudo systemctl start monarx-agent
docker compose -f docker-compose.prod.yml start
```

### Solution 4: Build During Off-Peak Hours

```bash
# Schedule build at 2 AM when system is idle
crontab -e

# Add this line:
0 2 * * * cd /root/fayo && nice -n 19 docker compose -f docker-compose.prod.yml build admin-panel
```

### Solution 5: Use GitHub Actions (Free CI/CD)

Create `.github/workflows/build.yml`:

```yaml
name: Build Docker Images
on:
  push:
    branches: [main]
    paths:
      - 'web/admin-panel/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build admin-panel
        run: |
          cd web/admin-panel
          docker build -t admin-panel:latest .
      
      - name: Save and compress image
        run: |
          docker save admin-panel:latest | gzip > admin-panel.tar.gz
      
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: admin-panel-image
          path: admin-panel.tar.gz
          retention-days: 7
```

Then download from GitHub Actions and load on VPS.

## Quick Comparison

| Method | Build Time | VPS Load | Best For |
|--------|-----------|----------|----------|
| Build on VPS | 16+ min | High | Development only |
| Build locally + transfer | 1-2 min | None | **Recommended** |
| Docker Hub | 30 sec (pull) | None | Production |
| GitHub Actions | 2-3 min | None | CI/CD workflow |

## Recommended Workflow

1. **Development**: Build locally, test, commit
2. **Production**: 
   - Option A: Build locally → Push to Docker Hub → Pull on VPS
   - Option B: Use GitHub Actions → Download artifact → Load on VPS

## Quick Script: Build and Transfer

Create `build-and-transfer.sh` on your local machine:

```bash
#!/bin/bash
# Build admin-panel locally and transfer to VPS

VPS_HOST="root@72.62.51.50"
VPS_PATH="/root/fayo"

echo "🔨 Building admin-panel..."
cd web/admin-panel
docker build -t admin-panel:latest .

echo "💾 Saving image..."
docker save admin-panel:latest | gzip > ../../admin-panel.tar.gz

echo "📤 Transferring to VPS..."
scp ../../admin-panel.tar.gz ${VPS_HOST}:${VPS_PATH}/

echo "✅ Done! On VPS, run:"
echo "  gunzip -c ${VPS_PATH}/admin-panel.tar.gz | docker load"
echo "  docker tag admin-panel:latest fayo-admin-panel:latest"
```

## Why This Works

- **Local machine**: Usually has more CPU/RAM, faster network
- **VPS**: Only needs to load image (seconds) instead of building (16+ minutes)
- **Result**: 95% faster deployment

## Next Steps

1. **Try building locally** and transferring (fastest)
2. **Or use Docker Hub** for easy image management
3. **Or set up GitHub Actions** for automated builds

The VPS should only run containers, not build them!

