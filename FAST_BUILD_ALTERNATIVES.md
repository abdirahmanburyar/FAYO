# Fast Build Alternatives - When npm install is Too Slow

## Current Problem

Your `npm install` is taking **981.9s (16+ minutes)**, which suggests:
- Very slow network connection to npm registry
- Resource-constrained VPS
- Network timeouts/retries

## Alternative Solutions

### Option 1: Use Yarn Instead of npm (Often Faster)

Yarn can be faster due to better caching and parallel downloads:

```dockerfile
# In Dockerfile, replace npm with yarn
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock* ./
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    (test -f yarn.lock && yarn install --frozen-lockfile --silent) || \
    (npm install --legacy-peer-deps --no-audit --no-fund --prefer-offline --silent)
```

**To use Yarn:**
```bash
# Install yarn locally
npm install -g yarn

# Generate yarn.lock
cd web/admin-panel
yarn install

# Then rebuild
docker compose -f docker-compose.prod.yml build admin-panel
```

### Option 2: Use npm Registry Mirror (If in China/Asia)

```dockerfile
# Add before npm install
RUN npm config set registry https://registry.npmmirror.com
```

Or use environment variable:
```yaml
# In docker-compose.prod.yml
admin-panel:
  build:
    args:
      - NPM_REGISTRY=https://registry.npmmirror.com
```

### Option 3: Build Locally and Push Image

Build on your local machine (faster) and push to registry:

```bash
# Build locally
docker build -t your-registry/admin-panel:latest ./web/admin-panel

# Push to registry
docker push your-registry/admin-panel:latest

# On VPS, pull and use
docker pull your-registry/admin-panel:latest
```

### Option 4: Use Pre-built Base Image with Dependencies

Create a base image with dependencies that rarely change:

```dockerfile
# Dockerfile.deps (build this once)
FROM node:22.17.1-alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund --prefer-offline --silent
```

Then in main Dockerfile:
```dockerfile
FROM your-registry/admin-panel-deps:latest AS deps
# Dependencies already installed
```

### Option 5: Use Docker BuildKit Cache Export/Import

```bash
# Build with cache export
DOCKER_BUILDKIT=1 docker build \
  --cache-from type=local,src=/tmp/.buildx-cache/admin-panel \
  --cache-to type=local,dest=/tmp/.buildx-cache/admin-panel,mode=max \
  -f web/admin-panel/Dockerfile \
  -t admin-panel \
  ./web/admin-panel
```

### Option 6: Reduce Dependencies (Long-term)

Review if all dependencies are needed:
- `agora-rtc-sdk-ng` - Large SDK, only load if needed
- `framer-motion` - Heavy animation library, consider lighter alternatives
- `@mui/x-data-grid` and `@mui/x-date-pickers` - Large, consider if all features needed

## Quick Fix: Use Faster npm Registry

Add to `.npmrc` or Dockerfile:

```dockerfile
# Use faster registry (adjust based on your location)
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-timeout 60000 && \
    npm config set fetch-retries 1
```

## Recommended: Build Strategy

For production, consider:

1. **Build on CI/CD** (GitHub Actions, GitLab CI) with better resources
2. **Build locally** and push image to registry
3. **Use multi-stage builds** with dependency caching
4. **Pre-build base images** with common dependencies

## Immediate Action

Try this optimized Dockerfile approach:

```dockerfile
# Use .npmrc file (already created)
COPY package.json package-lock.json* .npmrc* ./

# Single RUN command with all npm config
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/app/node_modules/.cache \
    npm ci --legacy-peer-deps --no-audit --no-fund --prefer-offline --silent --loglevel=error 2>&1 | head -20
```

The `2>&1 | head -20` limits output to first 20 lines, reducing I/O overhead.

