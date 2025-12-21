# Docker Build Optimization Guide

## Why Builds Were Slow

The Docker builds were slow due to:
1. **No BuildKit cache mounts** - npm packages were downloaded every time
2. **Retry logic with sleep delays** - Added 10-30 second delays on failures
3. **No layer caching optimization** - Source code copied before dependencies
4. **Prisma generate running unnecessarily** - Ran even when schema didn't change

## Optimizations Applied

### 1. BuildKit Cache Mounts
Both Dockerfiles now use BuildKit cache mounts (`--mount=type=cache`) to cache:
- npm packages (`/root/.npm`)
- node_modules cache (`/app/node_modules/.cache`)
- Next.js build cache (`.next/cache`)

### 2. Removed Retry Logic with Sleeps
Replaced retry loops with `--prefer-offline` flag to use cached packages first.

### 3. Optimized Layer Ordering
- Dependencies installed before copying source code
- Prisma generate runs only when schema changes
- Build step cached if source doesn't change

### 4. Service-Specific .dockerignore Files
Created `.dockerignore` files to exclude unnecessary files from build context.

## How to Use

### Enable BuildKit (Required for Cache Mounts)

**On Linux/Mac:**
```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

**On Windows (PowerShell):**
```powershell
$env:DOCKER_BUILDKIT=1
$env:COMPOSE_DOCKER_CLI_BUILD=1
```

**On Windows (Git Bash):**
```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

### Build with Optimizations

```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Build specific service
docker-compose -f docker-compose.prod.yml build api-service
docker-compose -f docker-compose.prod.yml build admin-panel

# Build in parallel (if supported)
docker-compose -f docker-compose.prod.yml build --parallel
```

## Expected Performance Improvements

- **First build**: Similar time (downloads all dependencies)
- **Subsequent builds** (no dependency changes): **50-70% faster**
- **Subsequent builds** (only source changes): **80-90% faster**
- **Subsequent builds** (no changes): **95% faster** (uses cache)

## Troubleshooting

If builds are still slow:

1. **Verify BuildKit is enabled:**
   ```bash
   docker buildx version
   ```

2. **Clear build cache if needed:**
   ```bash
   docker builder prune
   ```

3. **Check CPU/Memory limits:**
   - CPU quotas in docker-compose only affect running containers, not builds
   - Builds use all available CPU by default

4. **Monitor build progress:**
   ```bash
   docker-compose -f docker-compose.prod.yml build --progress=plain
   ```

## Additional Tips

- Use `docker-compose build --no-cache` only when you need a completely fresh build
- Keep `package.json` and `package-lock.json` stable to maximize cache hits
- Consider using Docker layer caching in CI/CD pipelines

