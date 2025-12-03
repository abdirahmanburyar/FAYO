#!/bin/bash
# Setup script for database backup cron job
# This script helps you set up automatic backups

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/database_backup.py"
PYTHON_CMD=$(which python3 || which python)

if [ -z "$PYTHON_CMD" ]; then
    echo "Error: Python 3 not found. Please install Python 3."
    exit 1
fi

echo "Database Backup Cron Job Setup"
echo "=============================="
echo ""
echo "Script location: $BACKUP_SCRIPT"
echo "Python command: $PYTHON_CMD"
echo ""

# Check if script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "Error: Backup script not found at $BACKUP_SCRIPT"
    exit 1
fi

# Make script executable
chmod +x "$BACKUP_SCRIPT"

# Create log directory
LOG_DIR="$SCRIPT_DIR/backups"
mkdir -p "$LOG_DIR"

echo "Choose schedule:"
echo "1. Daily at 2:00 AM (recommended)"
echo "2. Daily at 3:00 AM"
echo "3. Every 6 hours"
echo "4. Custom (you'll edit crontab manually)"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        CRON_SCHEDULE="0 2 * * *"
        ;;
    2)
        CRON_SCHEDULE="0 3 * * *"
        ;;
    3)
        CRON_SCHEDULE="0 */6 * * *"
        ;;
    4)
        echo "You can manually edit crontab with: crontab -e"
        echo "Add this line:"
        echo "$CRON_SCHEDULE $PYTHON_CMD $BACKUP_SCRIPT >> $LOG_DIR/backup_cron.log 2>&1"
        exit 0
        ;;
    *)
        echo "Invalid choice. Using default: Daily at 2:00 AM"
        CRON_SCHEDULE="0 2 * * *"
        ;;
esac

CRON_LINE="$CRON_SCHEDULE $PYTHON_CMD $BACKUP_SCRIPT >> $LOG_DIR/backup_cron.log 2>&1"

echo ""
echo "Cron job to be added:"
echo "$CRON_LINE"
echo ""

read -p "Add this cron job? (y/n): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Cancelled."
    exit 0
fi

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
    echo "Warning: A cron job for this script already exists."
    read -p "Replace it? (y/n): " replace
    if [ "$replace" = "y" ] || [ "$replace" = "Y" ]; then
        # Remove existing cron job
        crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" | crontab -
    else
        echo "Keeping existing cron job. Exiting."
        exit 0
    fi
fi

# Add cron job
(crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -

echo ""
echo "✓ Cron job added successfully!"
echo ""
echo "To view your cron jobs: crontab -l"
echo "To edit cron jobs: crontab -e"
echo "To remove this cron job: crontab -e (then delete the line)"
echo ""
echo "The backup will run according to the schedule you chose."
echo "Logs will be written to: $LOG_DIR/backup_cron.log"

