# Quick Start Guide

## Prerequisites
- Node.js 18+
- PostgreSQL running on localhost:5432
- Database `fayo_shared` created

## Quick Setup

1. **Create the database:**
   ```sql
   CREATE DATABASE fayo_shared;
   ```

2. **Set environment variables:**
   ```bash
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fayo_shared?schema=public"
   export REDIS_HOST=localhost
   export REDIS_PORT=6379
   export JWT_SECRET="your-super-secret-jwt-key-here-shared-service"
   export PORT=3004
   export CORS_ORIGIN="http://localhost:3000"
   ```

3. **Install and start:**
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   npm run start:dev
   ```

4. **Access the service:**
   - API: http://localhost:3004/api/v1/health
   - Docs: http://localhost:3004/api/docs
   - Specialties: http://localhost:3004/api/v1/specialties

## Test the API

```bash
# Health check
curl http://localhost:3004/api/v1/health

# Get specialties
curl http://localhost:3004/api/v1/specialties

# Get categories
curl http://localhost:3004/api/v1/specialties/categories
```

## Troubleshooting

If you get dependency errors, try:
```bash
rm -rf node_modules package-lock.json
npm install
```
