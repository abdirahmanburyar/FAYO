# Database Backup Script

This Python script automatically creates PostgreSQL database backups every 3 days and deletes old backups. **It uses Docker to connect to your PostgreSQL container**, so you don't need PostgreSQL client tools installed on your host machine.

## Features

- ✅ Automatic backup every 3 days
- ✅ Deletes old backup after creating new one
- ✅ Supports multiple databases
- ✅ Uses Docker to access PostgreSQL (no need for local pg_dump installation)
- ✅ Logging to file and console
- ✅ Metadata tracking (last backup date, backup file path)
- ✅ Error handling and recovery

## Requirements

1. **Python 3.6+** (uses only standard library)
2. **Docker** - Must be installed and the PostgreSQL container must be running
3. **Docker access** - The script needs permission to run `docker exec` and `docker cp` commands

## Configuration

The script uses environment variables for configuration. You can set them in:

1. Environment variables
2. A `.env` file (if using python-dotenv)
3. Or modify the defaults in the script

### Environment Variables

```bash
# Backup directory (default: ./backups)
BACKUP_DIR=./backups

# Docker container name (default: postgres)
DOCKER_CONTAINER=postgres

# Database credentials (for authentication inside Docker container)
DB_USER=postgres
DB_PASSWORD=postgres

# Databases to backup (comma-separated list)
DB_NAMES=fayo,user_service,hospital_service,doctor_service,specialty_service,appointment_service,payment_service
```

**Note:** The script uses `docker exec` to run `pg_dump` inside the PostgreSQL container, so you don't need PostgreSQL client tools installed on your host machine.

## Usage

### Manual Run (Testing)

Before setting up automation, test the script manually:

```bash
# Make script executable (Linux/macOS)
chmod +x scripts/database_backup.py

# Run the script
python scripts/database_backup.py
```

**Important:** The script checks if 3 days have passed since the last backup. On first run, it will create a backup. Subsequent runs within 3 days will skip. You can run it daily via cron - it will only create backups when needed.

### Scheduled Execution (Automated Backups)

#### Quick Setup (Recommended)

**Linux/macOS:**
```bash
# Run the setup script (interactive)
chmod +x scripts/setup_cron.sh
./scripts/setup_cron.sh
```

**Windows:**
```cmd
# Run the setup script (interactive)
scripts\setup_cron_windows.bat
```

#### Manual Setup

##### Windows Task Scheduler

1. Open Task Scheduler (`taskschd.msc`)
2. Create Basic Task
3. Set trigger: Daily at 2:00 AM
4. Action: Start a program
   - Program: `python` (or full path to python.exe)
   - Arguments: `C:\FAYO\scripts\database_backup.py`
   - Start in: `C:\FAYO\scripts`
5. Save and run

**Or use the automated setup script:**
```cmd
scripts\setup_cron_windows.bat
```

##### Linux Cron

**Option 1: Use the setup script (easiest)**
```bash
chmod +x scripts/setup_cron.sh
./scripts/setup_cron.sh
```

**Option 2: Manual setup**
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2:00 AM):
0 2 * * * /usr/bin/python3 /path/to/FAYO/scripts/database_backup.py >> /path/to/FAYO/scripts/backups/backup_cron.log 2>&1
```

**Note:** Replace `/path/to/FAYO` with your actual project path and `/usr/bin/python3` with your Python 3 path (find it with `which python3`).

**See `scripts/cron_examples.txt` for more cron job examples.**

**Why run daily if backups are every 3 days?**
- The script checks if 3 days have passed before creating a backup
- Running daily ensures backups happen exactly when needed
- It's safe to run daily - the script will skip if not needed
- Daily checks ensure the system is working and catch any issues early

#### Using systemd timer (Linux)

Create `/etc/systemd/system/db-backup.service`:
```ini
[Unit]
Description=Database Backup Service
After=network.target

[Service]
Type=oneshot
User=your-user
WorkingDirectory=/path/to/FAYO/scripts
ExecStart=/usr/bin/python3 /path/to/FAYO/scripts/database_backup.py
```

Create `/etc/systemd/system/db-backup.timer`:
```ini
[Unit]
Description=Run database backup every day
Requires=db-backup.service

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start:
```bash
sudo systemctl enable db-backup.timer
sudo systemctl start db-backup.timer
```

## Backup Format

- **Format**: PostgreSQL custom format (compressed)
- **Extension**: `.sql` (but it's actually a binary compressed format)
- **Naming**: `{database_name}_backup_{timestamp}.sql`
- **Location**: `./backups/` directory (or as specified in `BACKUP_DIR`)

## Restoring Backups

To restore a backup using Docker:

```bash
# Copy backup file into container
docker cp backup_file.sql postgres:/tmp/backup_file.sql

# Restore using pg_restore inside container
docker exec -e PGPASSWORD=postgres postgres pg_restore -h localhost -U postgres -d database_name -c /tmp/backup_file.sql

# Clean up
docker exec postgres rm /tmp/backup_file.sql
```

Or restore directly from host (if you have pg_restore installed):

```bash
# Set password
export PGPASSWORD=postgres

# Restore using pg_restore
pg_restore -h localhost -p 5432 -U postgres -d database_name -c backup_file.sql
```

## Metadata File

The script maintains a `backup_metadata.json` file in the backup directory that tracks:
- Last backup date for each database
- Path to the last backup file
- This ensures the script knows when to create the next backup

## Logging

Logs are written to:
- Console (stdout)
- File: `backups/backup.log`

## How It Works

1. **Check Last Backup**: Script checks `backup_metadata.json` for last backup date
2. **Time Check**: If 3+ days have passed since last backup, proceed
3. **Create Backup**: Uses `docker exec` to run `pg_dump` inside the PostgreSQL container
4. **Copy Backup**: Copies the backup file from container to host using `docker cp`
5. **Update Metadata**: Saves new backup info to metadata file
6. **Delete Old Backup**: Removes the previous backup file from host
7. **Cleanup**: Removes temporary backup file from container
8. **Repeat**: Does this for each configured database

## Example Output

```
2024-01-15 02:00:00 - INFO - ============================================================
2024-01-15 02:00:00 - INFO - Starting database backup process
2024-01-15 02:00:00 - INFO - Using Docker container: postgres
2024-01-15 02:00:00 - INFO - ============================================================
2024-01-15 02:00:00 - INFO - Backup directory: ./backups

2024-01-15 02:00:01 - INFO - Processing database: fayo
2024-01-15 02:00:01 - INFO - Days since last backup for fayo: 3
2024-01-15 02:00:01 - INFO - Creating backup for database: fayo (using Docker container: postgres)
2024-01-15 02:00:05 - INFO - Backup created successfully: fayo_backup_20240115_020001.sql (45.23 MB)
2024-01-15 02:00:05 - INFO - Deleted old backup: fayo_backup_20240112_020001.sql

2024-01-15 02:00:05 - INFO - ============================================================
2024-01-15 02:00:05 - INFO - Backup process completed
2024-01-15 02:00:05 - INFO - ============================================================
```

## Troubleshooting

### docker: command not found
- Install Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Ensure Docker is running and accessible from command line

### Container not found
- Verify the container name matches `DOCKER_CONTAINER` environment variable (default: `postgres`)
- Check if container is running: `docker ps | grep postgres`
- If using docker-compose, the container name might be different

### Permission denied
- Ensure backup directory is writable
- Check Docker permissions (on Linux, you may need to add user to docker group)
- Check database user has backup permissions inside container

### Backup file not created
- Check disk space
- Verify database name is correct
- Check if container is running: `docker ps`
- Check container logs: `docker logs postgres`
- Verify database exists: `docker exec postgres psql -U postgres -l`

## Security Notes

- **Password Storage**: The script uses `PGPASSWORD` environment variable. Consider using `.pgpass` file for better security
- **Backup Location**: Store backups in a secure location, possibly encrypted
- **Access Control**: Limit access to backup files and metadata

## Customization

To change the backup interval, modify `BACKUP_INTERVAL_DAYS` in the script:

```python
BACKUP_INTERVAL_DAYS = 3  # Change to desired number of days
```

