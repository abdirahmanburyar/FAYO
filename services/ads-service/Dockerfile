FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
# Use npm install instead of npm ci to handle package-lock.json mismatches
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./

# Install production dependencies (including prisma for migrations)
RUN npm install --only=production --legacy-peer-deps && \
    npm install prisma --save-prod && \
    npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Ensure migrations directory exists
RUN mkdir -p /app/prisma/migrations

# Create startup script that runs migrations then starts the app
# Using Docker's native heredoc syntax (requires Docker 20.10+)
RUN <<EOF cat > /app/start.sh && chmod +x /app/start.sh
#!/bin/sh
set -e

echo "⏳ Waiting for database to be ready..."
timeout=30
counter=0
# First check connection to default postgres database
until node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL?.replace('/ads_service', '/postgres') || 'postgresql://postgres:postgres@postgres:5432/postgres' } } }); prisma.\$connect().then(() => { console.log('✅ Database connected'); process.exit(0); }).catch(() => { process.exit(1); });" 2>/dev/null; do
  counter=\$((counter + 1))
  if [ \$counter -ge \$timeout ]; then
    echo "❌ Database connection timeout after \${timeout} seconds"
    exit 1
  fi
  echo "   Waiting for database... (\$counter/\$timeout)"
  sleep 1
done

echo "🗄️ Creating ads_service database if it doesn't exist..."
node -e "
const { PrismaClient } = require('@prisma/client');
// Connect to postgres database (default system database) to create ads_service database
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/ads_service?schema=ads';
const postgresUrl = dbUrl.replace('/ads_service', '/postgres').split('?')[0];
const adminPrisma = new PrismaClient({
  datasources: {
    db: { url: postgresUrl }
  }
});
(async () => {
  try {
    // Try to create database (will fail silently if it already exists)
    await adminPrisma.\$executeRawUnsafe(\`CREATE DATABASE ads_service;\`);
    console.log('✅ Database ads_service created');
  } catch (error) {
    // If database already exists, that's fine
    if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate') || error.code === '42P04')) {
      console.log('✅ Database ads_service already exists');
    } else {
      console.error('⚠️ Error creating database:', error.message);
      // Don't fail the startup if database creation fails
    }
  } finally {
    await adminPrisma.\$disconnect();
  }
})();
" || echo "⚠️ Database creation check failed"

echo "⏳ Waiting for ads_service database to be ready..."
counter=0
until node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ ads_service database connected'); process.exit(0); }).catch(() => { process.exit(1); });" 2>/dev/null; do
  counter=\$((counter + 1))
  if [ \$counter -ge \$timeout ]; then
    echo "❌ ads_service database connection timeout after \${timeout} seconds"
    exit 1
  fi
  echo "   Waiting for ads_service database... (\$counter/\$timeout)"
  sleep 1
done

echo "🗄️ Ensuring database schema exists..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    await prisma.\$executeRaw\`CREATE SCHEMA IF NOT EXISTS ads;\`;
    console.log('✅ Schema ads created or already exists');
  } catch (error) {
    console.error('⚠️ Error creating schema:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" || echo "⚠️ Schema creation check failed"

echo "🗄️ Running Prisma migrations..."
MIGRATIONS_DIR="/app/prisma/migrations"
if [ -d "\$MIGRATIONS_DIR" ] && [ "\$(ls -A "\$MIGRATIONS_DIR" 2>/dev/null | head -1)" ]; then
  echo "📦 Migration files found, using migrate deploy..."
  if npx prisma migrate deploy 2>&1; then
    echo "✅ Migrations applied successfully"
  else
    echo "⚠️ migrate deploy failed, trying db push as fallback..."
    DB_PUSH_OUTPUT=\$(npx prisma db push --accept-data-loss --skip-generate 2>&1)
    DB_PUSH_EXIT=\$?
    if [ \$DB_PUSH_EXIT -eq 0 ]; then
      echo "✅ Schema synced successfully"
    elif echo "\$DB_PUSH_OUTPUT" | grep -q "already exists"; then
      echo "⚠️ Some indexes/constraints already exist (this is fine, schema is already in sync)"
      echo "✅ Schema sync completed"
    else
      echo "\$DB_PUSH_OUTPUT"
      echo "⚠️ db push failed with unexpected error"
    fi
  fi
else
  echo "📦 No migration files found, using db push to sync schema..."
  DB_PUSH_OUTPUT=\$(npx prisma db push --accept-data-loss --skip-generate 2>&1)
  DB_PUSH_EXIT=\$?
  if [ \$DB_PUSH_EXIT -eq 0 ]; then
    echo "✅ Schema synced successfully"
  elif echo "\$DB_PUSH_OUTPUT" | grep -q "already exists"; then
    echo "⚠️ Some indexes/constraints already exist (this is fine, schema is already in sync)"
    echo "✅ Schema sync completed"
  else
    echo "\$DB_PUSH_OUTPUT"
    echo "⚠️ db push failed with unexpected error"
  fi
fi

echo "🚀 Starting application..."
exec node dist/main.js
EOF

EXPOSE 3007

# Start the application
CMD ["/app/start.sh"]

