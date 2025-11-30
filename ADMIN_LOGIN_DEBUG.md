# Admin Login Debugging Guide

## Issue
Admin-panel returns 500 error when trying to login, even though user-service login endpoint works directly.

## Root Cause Analysis

The admin-panel API route (`/api/v1/auth/admin-login`) runs **server-side** in the Next.js container and needs to reach `user-service:3001` using Docker's internal network.

## Diagnostic Commands

Run these commands on your VPS to diagnose the issue:

### 1. Check if admin-panel can reach user-service

```bash
# Test connectivity from admin-panel container
docker exec admin-panel wget -O- --timeout=5 http://user-service:3001/api/v1/health 2>&1
```

**Expected:** Should return health check response
**If fails:** Network connectivity issue between containers

### 2. Check environment variables in admin-panel

```bash
# Check what USER_SERVICE_URL is set to
docker exec admin-panel env | grep USER_SERVICE_URL

# Check all service URLs
docker exec admin-panel env | grep SERVICE_URL
```

**Expected:** `USER_SERVICE_URL=http://user-service:3001`
**If shows localhost:** Environment variable not set correctly

### 3. Check admin-panel logs for errors

```bash
# View recent logs
docker compose -f docker-compose.prod.yml logs admin-panel --tail 100

# Watch logs in real-time (then try to login)
docker compose -f docker-compose.prod.yml logs -f admin-panel
```

**Look for:**
- "Admin login - calling: http://..."
- Any fetch errors
- Network errors
- Timeout errors

### 4. Test the API route directly

```bash
# Test the Next.js API route from inside the container
docker exec admin-panel curl -X POST http://localhost:3000/api/v1/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"0001","password":"admin123"}' \
  -v
```

### 5. Verify docker-compose configuration

```bash
# Check if docker-compose has the correct environment variables
cd /root/fayo
grep -A 15 "admin-panel:" docker-compose.prod.yml | grep USER_SERVICE_URL
```

**Expected:** `USER_SERVICE_URL: ${USER_SERVICE_URL:-http://user-service:3001}`

## Solutions

### Solution 1: Restart admin-panel to pick up env vars

```bash
cd /root/fayo
docker compose -f docker-compose.prod.yml restart admin-panel
```

### Solution 2: Force recreate admin-panel container

```bash
cd /root/fayo
docker compose -f docker-compose.prod.yml up -d --force-recreate admin-panel
```

### Solution 3: Rebuild and restart (if code was updated)

```bash
cd /root/fayo
docker compose -f docker-compose.prod.yml build admin-panel
docker compose -f docker-compose.prod.yml up -d admin-panel
```

### Solution 4: Check network connectivity

```bash
# Verify both containers are on the same network
docker network inspect fayo_fayo-network | grep -A 5 "Containers"

# Should show both admin-panel and user-service
```

### Solution 5: Manual environment variable check

```bash
# Enter admin-panel container and check
docker exec -it admin-panel sh

# Inside container, check:
echo $USER_SERVICE_URL
node -e "console.log(process.env.USER_SERVICE_URL)"

# Test connectivity
wget -O- http://user-service:3001/api/v1/health
```

## Expected Behavior

After fixes, when you login:
1. Browser sends POST to `/api/v1/auth/admin-login`
2. Next.js API route receives request
3. API route calls `http://user-service:3001/api/v1/auth/admin-login`
4. User-service validates credentials and returns token
5. API route returns token to browser
6. Browser stores token and redirects to dashboard

## Common Issues

1. **Environment variable not set:** Admin-panel uses `72.62.51.50:3001` instead of `user-service:3001`
   - **Fix:** Restart or recreate container

2. **Network issue:** Containers can't communicate
   - **Fix:** Verify both are on `fayo-network`

3. **Next.js build cache:** Old build has hardcoded URLs
   - **Fix:** Rebuild the container

4. **DNS resolution:** Container can't resolve `user-service` hostname
   - **Fix:** Check Docker network configuration

