#!/bin/bash
# Restore database from backup file
# Usage: ./restore-database.sh [backup_file_path]

set -e

BACKUP_FILE="${1:-/root/backup/fayo_backup_20251221_151454.sql}"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    echo ""
    echo "Usage: ./restore-database.sh [backup_file_path]"
    echo "Example: ./restore-database.sh /root/backup/fayo_backup_20251221_151454.sql"
    exit 1
fi

echo "📦 Restoring database from backup..."
echo "   Backup file: $BACKUP_FILE"
echo ""

# Check if PostgreSQL is running
if ! sudo systemctl is-active --quiet postgresql; then
    echo "⚠️  PostgreSQL is not running. Starting it..."
    sudo systemctl start postgresql
    sleep 2
fi

# Check if database exists, create if not
echo "🔍 Checking if database 'fayo' exists..."
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw fayo; then
    echo "📝 Creating database 'fayo'..."
    sudo -u postgres psql -c "CREATE DATABASE fayo;"
else
    echo "✅ Database 'fayo' already exists"
fi

# Restore backup
echo "📥 Restoring backup..."
echo "   This may take a few minutes depending on backup size..."
echo ""

# Check if backup is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "📦 Detected compressed backup, decompressing..."
    gunzip -c "$BACKUP_FILE" | sudo -u postgres psql -d fayo
else
    sudo -u postgres psql -d fayo < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database restored successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Baseline the database for Prisma:"
    echo "     cd services/api-service"
    echo "     npx prisma migrate resolve --applied baseline"
    echo "     # OR run: ./baseline-database.sh"
    echo ""
    echo "  2. Verify restoration:"
    echo "     sudo -u postgres psql -d fayo -c '\\dt'"
    echo ""
else
    echo ""
    echo "❌ Database restoration failed!"
    echo "   Check the error messages above"
    exit 1
fi

