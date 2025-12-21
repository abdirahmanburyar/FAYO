# Build Performance Tips - When npm install Takes 16+ Minutes

## The Problem

Your `npm install` is taking **981.9s (16+ minutes)**, which is extremely slow. This indicates:

1. **Very slow network** to npm registry
2. **Resource constraints** on VPS (CPU/memory)
3. **Network timeouts** causing retries

## Immediate Solutions

### Solution 1: Build Locally and Push (Recommended)

Build on your local machine (usually faster) and push to registry:

```bash
# On your local machine
cd web/admin-panel
docker build -t your-registry/admin-panel:latest .

# Push to registry (Docker Hub, GitHub Container Registry, etc.)
docker push your-registry/admin-panel:latest

# On VPS, update docker-compose.prod.yml to use the image
# Or pull and tag:
docker pull your-registry/admin-panel:latest
docker tag your-registry/admin-panel:latest fayo-admin-panel:latest
```

### Solution 2: Use npm Registry Mirror

If you're in a region with slow npm registry access:

```bash
# In .npmrc or Dockerfile, use a faster mirror
# China: https://registry.npmmirror.com
# Europe: https://registry.npmjs.org/ (default)
# Or use environment variable:
NPM_CONFIG_REGISTRY=https://registry.npmmirror.com docker compose build
```

### Solution 3: Use Yarn (Often Faster)

Yarn can be 2-3x faster than npm in some cases:

```bash
# Install yarn
npm install -g yarn

# Generate yarn.lock
cd web/admin-panel
yarn install

# Update Dockerfile to use yarn
# Replace npm ci with: yarn install --frozen-lockfile
```

### Solution 4: Pre-download Dependencies

Download dependencies once and reuse:

```bash
# Create a base image with dependencies
docker build -f Dockerfile.deps -t admin-panel-deps:latest ./web/admin-panel

# Then use it in main Dockerfile
FROM admin-panel-deps:latest AS deps
# Dependencies already installed
```

### Solution 5: Use CI/CD for Builds

Build on GitHub Actions, GitLab CI, or similar (better resources):

```yaml
# .github/workflows/build.yml
name: Build Admin Panel
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push
        run: |
          docker build -t your-registry/admin-panel:${{ github.sha }} ./web/admin-panel
          docker push your-registry/admin-panel:${{ github.sha }}
```

## Optimizations Already Applied

✅ **Reduced npm retries** - Fail fast if network is bad
✅ **Reduced timeouts** - Don't wait too long
✅ **Silent mode** - Less I/O overhead
✅ **Cache mounts** - Reuse downloaded packages
✅ **Combined commands** - Fewer layers

## Check Network Speed

Test npm registry speed:

```bash
# Test npm registry response time
time curl -I https://registry.npmjs.org/

# Test specific package download
time npm view react version

# If slow, consider using a CDN or mirror
```

## Monitor Build Progress

```bash
# Build with verbose output to see what's slow
DOCKER_BUILDKIT=1 docker build --progress=plain -f web/admin-panel/Dockerfile ./web/admin-panel 2>&1 | tee build.log

# Check which step takes longest
grep "RUN\|COPY" build.log | sort -k2 -n
```

## Expected Times

- **Good network**: npm install should take 30-60s
- **Average network**: npm install should take 1-3 minutes
- **Slow network**: npm install can take 5-10 minutes
- **Your case (16+ min)**: Network or resource issue

## Quick Test

After optimizations, the build should be faster. But if it's still slow, the issue is likely:

1. **Network speed** - Use a mirror or build locally
2. **VPS resources** - Upgrade VPS or build elsewhere
3. **npm registry issues** - Use alternative registry

## Recommended Approach

For production, I recommend:

1. **Build on CI/CD** (GitHub Actions, etc.) with better resources
2. **Push image to registry**
3. **Pull on VPS** - Much faster than building

This way, your VPS only needs to pull the image (seconds) instead of building (16+ minutes).

