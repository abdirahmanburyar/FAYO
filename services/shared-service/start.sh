#!/bin/sh
set -e

echo "⏳ Waiting for database to be ready..."
# Wait for database connection (max 30 seconds)
timeout=30
counter=0
until node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ Database connected'); process.exit(0); }).catch(() => { process.exit(1); });" 2>/dev/null; do
  counter=$((counter + 1))
  if [ $counter -ge $timeout ]; then
    echo "❌ Database connection timeout after ${timeout} seconds"
    exit 1
  fi
  echo "   Waiting for database... ($counter/$timeout)"
  sleep 1
done

echo "🗄️ Ensuring database schema exists..."
# Create the shared schema if it doesn't exist
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    await prisma.\$executeRaw\`CREATE SCHEMA IF NOT EXISTS shared;\`;
    console.log('✅ Schema shared created or already exists');
  } catch (error) {
    console.error('⚠️ Error creating schema:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" || echo "⚠️ Schema creation check failed"

echo "🗄️ Resolving any failed migrations..."
# First, resolve any failed migrations by marking them as rolled back
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    # Check if there are failed migrations and resolve them
    const result = await prisma.\$executeRaw\`
      UPDATE _prisma_migrations 
      SET finished_at = NOW(), 
          rolled_back_at = NOW()
      WHERE finished_at IS NULL 
        AND started_at IS NOT NULL
        AND rolled_back_at IS NULL;
    \`;
    console.log('✅ Resolved failed migrations');
  } catch (error) {
    # If _prisma_migrations table doesn't exist, that's fine - migrations haven't run yet
    if (error.message.includes('does not exist') || error.message.includes('relation')) {
      console.log('ℹ️ No migration history found, will create fresh');
    } else {
      console.error('⚠️ Error resolving migrations:', error.message);
    }
  } finally {
    await prisma.\$disconnect();
  }
})();
" || echo "⚠️ Migration resolution check failed"

echo "🗄️ Running Prisma migrations..."
# Check if migrations directory exists and has content
MIGRATIONS_DIR="/app/prisma/migrations"
if [ -d "$MIGRATIONS_DIR" ] && [ "$(ls -A "$MIGRATIONS_DIR" 2>/dev/null | head -1)" ]; then
  echo "📦 Migration files found, using migrate deploy..."
  if npx prisma migrate deploy 2>&1; then
    echo "✅ Migrations applied successfully"
  else
    echo "⚠️ migrate deploy failed, trying db push as fallback..."
    npx prisma db push --accept-data-loss --skip-generate || echo "⚠️ db push also failed"
  fi
else
  echo "📦 No migration files found, using db push to sync schema..."
  npx prisma db push --accept-data-loss --skip-generate || echo "⚠️ db push failed"
fi

echo "🚀 Starting application..."
exec node dist/main.js
