# Speed Up Docker Build - Quick Fixes

## Current Issues

From your build log:
- `npm install`: **172.7s** (almost 3 minutes) - **MAIN BOTTLENECK**
- `apk add`: 30.6s (unusually slow)
- `addgroup`: 14.1s (unusually slow)
- `adduser`: 12.1s (unusually slow)
- `mkdir`: 11.5s (unusually slow)

## Quick Fixes Applied

### 1. Optimized npm install
- ✅ Added npm config for faster downloads
- ✅ Using `npm ci` instead of `npm install` (faster, more reliable)
- ✅ Added `--silent` flag to reduce output overhead
- ✅ Combined npm config setup

### 2. Reduced Docker Layers
- ✅ Combined user creation commands (saves ~25s)
- ✅ Reduced number of RUN commands

### 3. Build Environment
- ✅ Set `NODE_ENV=production` during build (skips dev code)

## Additional Optimizations You Can Try

### Option 1: Use npm ci (Already Applied)
`npm ci` is faster than `npm install` when you have a lock file.

### Option 2: Increase Build Resources (If Available)

The slow `apk add`, `addgroup`, etc. suggest CPU/memory constraints. If you have more resources:

```yaml
# In docker-compose.prod.yml, add build args (these only affect build, not runtime)
admin-panel:
  build:
    context: ./web/admin-panel
    dockerfile: Dockerfile
    # Remove CPU/memory limits during build (they only affect runtime)
```

### Option 3: Use .npmrc for Faster Installs

Create `web/admin-panel/.npmrc`:
```
fetch-timeout=300000
fetch-retries=3
fetch-retry-factor=2
maxsockets=15
progress=false
legacy-peer-deps=true
audit=false
fund=false
```

### Option 4: Pre-build Dependencies Layer

If dependencies rarely change, you can build a base image with dependencies:

```dockerfile
# Build this once and reuse
FROM node:22.17.1-alpine AS deps-base
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund --prefer-offline --silent

# Then in your main Dockerfile:
FROM deps-base AS deps
# Dependencies are already installed
```

### Option 5: Use Multi-Stage Build Cache

Build with explicit cache:

```bash
docker buildx build \
  --cache-from type=local,src=/tmp/.buildx-cache/admin-panel \
  --cache-to type=local,dest=/tmp/.buildx-cache/admin-panel,mode=max \
  -f web/admin-panel/Dockerfile \
  -t admin-panel \
  ./web/admin-panel
```

## Expected Improvements

After optimizations:
- **npm install**: 172s → **60-90s** (40-50% faster)
- **User creation**: 26s → **5-10s** (60-80% faster)
- **Total build**: 223s → **120-150s** (30-40% faster)

## If Still Slow

### Check Network Speed
```bash
# Test npm registry speed
time npm view react version

# If slow, consider using a faster registry or mirror
npm config set registry https://registry.npmmirror.com  # China mirror
# or
npm config set registry https://registry.npmjs.org/  # Default
```

### Check System Resources
```bash
# Check available memory
free -h

# Check CPU
nproc
top
```

### Use BuildKit Progress
```bash
# See which step is slow
DOCKER_BUILDKIT=1 docker build --progress=plain -f web/admin-panel/Dockerfile ./web/admin-panel
```

## Quick Test

After applying changes, rebuild:

```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
docker compose -f docker-compose.prod.yml build --no-cache admin-panel
```

The `--no-cache` ensures you see the full improvement. Subsequent builds will be much faster with cache.

