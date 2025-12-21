# Optimize VPS for Faster Docker Builds

## Current VPS Status

From your `ps` output:
- `systemd-bench`: **639% CPU** - This is very high and unusual
- `monarx-agent`: **11% CPU** - Monitoring agent
- `dockerd`: **10.3% CPU** - Docker daemon
- `containerd`: **3.9% CPU** - Container runtime

## The Problem

High CPU usage from other processes is competing with Docker builds, making them extremely slow.

## Solutions

### Solution 1: Stop Unnecessary Services During Build (Quick Fix)

```bash
# Check what systemd-bench is
systemctl status systemd-bench

# If it's not critical, stop it temporarily during builds
sudo systemctl stop systemd-bench

# Build your containers
docker compose -f docker-compose.prod.yml build

# Restart it after build (if needed)
sudo systemctl start systemd-bench
```

### Solution 2: Lower Process Priority for Builds

Run Docker build with lower priority (nice):

```bash
# Build with lower priority (won't interfere with other processes)
nice -n 19 docker compose -f docker-compose.prod.yml build admin-panel
```

### Solution 3: Limit Docker Build Resources

Add resource limits to docker-compose build:

```yaml
# In docker-compose.prod.yml
admin-panel:
  build:
    context: ./web/admin-panel
    dockerfile: Dockerfile
    # Limit build resources (optional)
    args:
      BUILDKIT_INLINE_CACHE: 1
```

### Solution 4: Build During Off-Peak Hours

Schedule builds when system load is lower:

```bash
# Use cron to build at 2 AM
0 2 * * * cd /root/fayo && docker compose -f docker-compose.prod.yml build admin-panel
```

### Solution 5: Use ionice for I/O Priority

If disk I/O is the bottleneck:

```bash
# Build with idle I/O priority
ionice -c 3 nice -n 19 docker compose -f docker-compose.prod.yml build admin-panel
```

### Solution 6: Check and Stop Unnecessary Containers

```bash
# List running containers
docker ps

# Stop containers you don't need during build
docker stop container1 container2

# Build
docker compose -f docker-compose.prod.yml build

# Start containers back
docker start container1 container2
```

## Recommended: Build Locally or Use CI/CD

Since your VPS is resource-constrained, the best solution is:

### Option A: Build Locally

```bash
# On your local machine
cd web/admin-panel
docker build -t admin-panel:latest .

# Save as tar file
docker save admin-panel:latest | gzip > admin-panel.tar.gz

# Transfer to VPS
scp admin-panel.tar.gz root@your-vps:/root/

# On VPS, load the image
docker load < admin-panel.tar.gz
docker tag admin-panel:latest fayo-admin-panel:latest
```

### Option B: Use GitHub Actions (Free)

Create `.github/workflows/build.yml`:

```yaml
name: Build and Push Docker Images
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build admin-panel
        run: |
          cd web/admin-panel
          docker build -t admin-panel:latest .
      - name: Save image
        run: |
          docker save admin-panel:latest | gzip > admin-panel.tar.gz
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: admin-panel-image
          path: admin-panel.tar.gz
```

Then download from GitHub Actions and load on VPS.

## Quick Commands to Check System

```bash
# Check overall system load
uptime

# Check memory usage
free -h

# Check disk I/O
iostat -x 1

# Check what's using CPU
top -b -n 1 | head -20

# Check Docker resource usage
docker stats --no-stream

# Check systemd services
systemctl list-units --type=service --state=running | grep -E "(bench|monarx)"
```

## Immediate Action

1. **Check systemd-bench**:
   ```bash
   systemctl status systemd-bench
   systemctl list-units | grep bench
   ```

2. **If it's safe to stop, stop it during builds**:
   ```bash
   sudo systemctl stop systemd-bench
   docker compose -f docker-compose.prod.yml build admin-panel
   sudo systemctl start systemd-bench
   ```

3. **Or build with lower priority**:
   ```bash
   nice -n 19 ionice -c 3 docker compose -f docker-compose.prod.yml build admin-panel
   ```

## Expected Improvement

- **Without optimization**: 16+ minutes
- **With stopped services**: 8-12 minutes (30-50% faster)
- **With local build**: 1-2 minutes (95% faster)

The best solution is building locally or on CI/CD, then transferring the image to your VPS.

