# Setup Environment Variables for PM2

## Quick Setup

Since we moved from Docker to direct installation, you need to set environment variables.

## Option 1: Create .env file (Recommended)

```bash
cd /root/fayo/services/api-service

# Copy example file
cp .env.example .env

# Edit if needed
nano .env
```

The `.env` file should contain:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fayo?schema=public&schema=users&schema=hospitals&schema=appointments&schema=payments&schema=ads"
```

## Option 2: Export Environment Variable (Temporary)

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fayo?schema=public&schema=users&schema=hospitals&schema=appointments&schema=payments&schema=ads"

# Then run migration
npx prisma migrate deploy
```

## Option 3: Use PM2 Ecosystem Config

The `ecosystem.config.js` already has the DATABASE_URL set. When running with PM2, it will use those values.

## For Prisma Commands (Outside PM2)

When running Prisma commands directly (like `npx prisma migrate deploy`), you need to either:

1. **Create .env file** (recommended)
2. **Export the variable** before running the command

## Create .env File Now

```bash
cd /root/fayo/services/api-service

# Create .env file
cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fayo?schema=public&schema=users&schema=hospitals&schema=appointments&schema=payments&schema=ads"
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_URL=amqp://guest:guest@localhost:5672
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
EOF

# Now run migration
npx prisma migrate deploy
```

## Verify .env File

```bash
# Check if .env exists
ls -la /root/fayo/services/api-service/.env

# View contents (be careful, contains passwords)
cat /root/fayo/services/api-service/.env
```

## Important Notes

- **`.env` file is for Prisma CLI commands** (migrate, studio, etc.)
- **PM2 uses `ecosystem.config.js`** for runtime environment variables
- Both should have the same values for consistency
- **Never commit `.env` to git** (it should be in `.gitignore`)

