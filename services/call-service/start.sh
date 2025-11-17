#!/bin/sh
set -e

echo "🚀 Starting Call Service..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
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
# Create the call schema if it doesn't exist
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    await prisma.\$executeRaw\`CREATE SCHEMA IF NOT EXISTS call;\`;
    console.log('✅ Schema call created or already exists');
  } catch (error) {
    console.error('⚠️ Error creating schema:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" || echo "⚠️ Schema creation check failed"

echo "🗄️ Running Prisma migrations..."
# Check if migrations directory exists and has content
MIGRATIONS_DIR="/app/prisma/migrations"
if [ -d "$MIGRATIONS_DIR" ] && [ "$(ls -A "$MIGRATIONS_DIR" 2>/dev/null | head -1)" ]; then
  echo "📦 Migration files found, using migrate deploy..."
  if npx prisma migrate deploy 2>&1; then
    echo "✅ Migrations applied successfully"
  else
    echo "⚠️ migrate deploy failed, trying db push as fallback..."
    npx prisma db push --accept-data-loss --skip-generate || {
      echo "❌ Migration failed. Please check database connection and schema."
      exit 1
    }
  fi
else
  echo "📦 No migration files found, using db push to sync schema..."
  npx prisma db push --accept-data-loss --skip-generate || {
    echo "❌ Schema push failed. Please check database connection."
    exit 1
  }
fi

echo "🚀 Starting NestJS application..."
exec node dist/main.js

