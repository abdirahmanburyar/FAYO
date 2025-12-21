#!/bin/sh
set -e

# Create uploads directories with proper permissions if they don't exist
UPLOAD_DIRS="/app/uploads/ads /app/uploads/doctors /app/uploads/hospitals /app/uploads/users"

for dir in $UPLOAD_DIRS; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo "✅ Created uploads directory: $dir"
    fi
done

# Ensure the directories have correct permissions (in case volume was mounted with wrong permissions)
# This will work if running as root, otherwise it will fail gracefully
chown -R nestjs:nodejs /app/uploads 2>/dev/null || true
chmod -R 755 /app/uploads 2>/dev/null || true

# If we're running as root, switch to nestjs user; otherwise run directly
if [ "$(id -u)" = "0" ]; then
    exec su-exec nestjs "$@"
else
    exec "$@"
fi


