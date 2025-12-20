#!/bin/sh
set -e

# Create uploads directory with proper permissions if it doesn't exist
if [ ! -d "/app/uploads/ads" ]; then
    mkdir -p /app/uploads/ads
    echo "✅ Created uploads directory structure"
fi

# Ensure the directory has correct permissions (in case volume was mounted with wrong permissions)
# This will work if running as root, otherwise it will fail gracefully
chown -R nestjs:nodejs /app/uploads 2>/dev/null || true
chmod -R 755 /app/uploads 2>/dev/null || true

# If we're running as root, switch to nestjs user; otherwise run directly
if [ "$(id -u)" = "0" ]; then
    exec su-exec nestjs "$@"
else
    exec "$@"
fi

