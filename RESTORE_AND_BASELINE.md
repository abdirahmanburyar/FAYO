# Restore Database and Baseline for Prisma

## Step 1: Restore Database from Backup

```bash
# Make script executable
chmod +x restore-database.sh

# Restore from backup
./restore-database.sh /root/backup/fayo_backup_20251221_151454.sql
```

Or manually:

```bash
# Restore backup
sudo -u postgres psql -d fayo < /root/backup/fayo_backup_20251221_151454.sql
```

## Step 2: Baseline Database for Prisma

After restoring, baseline the database so Prisma knows the current state:

```bash
cd /root/fayo/services/api-service

# Option 1: Use the baseline script
../baseline-database.sh

# Option 2: Manual baseline
npx prisma migrate dev --name baseline --create-only
npx prisma migrate resolve --applied baseline
```

## Complete Workflow

```bash
# 1. Restore backup
cd /root/fayo
./restore-database.sh /root/backup/fayo_backup_20251221_151454.sql

# 2. Baseline database
cd services/api-service
../baseline-database.sh

# 3. Verify
npx prisma migrate status

# 4. Start services
cd ../..
pm2 start ecosystem.config.js
```

## Verify Restoration

```bash
# Check tables in each schema
sudo -u postgres psql -d fayo -c "\dn"  # List schemas
sudo -u postgres psql -d fayo -c "\dt users.*"  # Users schema tables
sudo -u postgres psql -d fayo -c "\dt hospitals.*"  # Hospitals schema tables
sudo -u postgres psql -d fayo -c "\dt public.*"  # Public schema tables
sudo -u postgres psql -d fayo -c "\dt appointments.*"  # Appointments schema tables
sudo -u postgres psql -d fayo -c "\dt payments.*"  # Payments schema tables
sudo -u postgres psql -d fayo -c "\dt ads.*"  # Ads schema tables

# Count records (example)
sudo -u postgres psql -d fayo -c "SELECT COUNT(*) FROM users.users;"
sudo -u postgres psql -d fayo -c "SELECT COUNT(*) FROM public.specialties;"
```

## Troubleshooting

### Backup file not found
```bash
# List available backups
ls -lh /root/backup/

# Use correct path
./restore-database.sh /root/backup/fayo_backup_YYYYMMDD_HHMMSS.sql
```

### Permission denied
```bash
# Ensure you have sudo access
sudo -u postgres psql -d fayo -c "SELECT 1;"
```

### Database connection error
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start if needed
sudo systemctl start postgresql
```

### Prisma baseline fails
```bash
# Use db push as alternative (no migration history)
cd services/api-service
npx prisma db push --accept-data-loss
```

