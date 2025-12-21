# Database Backup Commands

## Quick Backup (Before Removing Docker Container)

### 1. Check if PostgreSQL container is running
```bash
docker ps | grep postgres
```

### 2. Create backup directory
```bash
mkdir -p backups
```

### 3. Dump the database (Plain SQL format - recommended)
```bash
docker exec -t postgres pg_dump -U postgres -d fayo > backups/fayo_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 4. Or dump with compression (smaller file)
```bash
docker exec -t postgres pg_dump -U postgres -d fayo | gzip > backups/fayo_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 5. Verify backup file was created
```bash
ls -lh backups/
```

### 6. Check backup file size
```bash
du -h backups/fayo_backup_*.sql*
```

## Alternative: Dump all databases (including system)
```bash
docker exec -t postgres pg_dumpall -U postgres > backups/fayo_full_backup_$(date +%Y%m%d_%H%M%S).sql
```

## Restore Commands (for later)

### Restore to Docker PostgreSQL
```bash
cat backups/fayo_backup_YYYYMMDD_HHMMSS.sql | docker exec -i postgres psql -U postgres -d fayo
```

### Restore to Direct PostgreSQL (after migration)
```bash
psql -U postgres -d fayo < backups/fayo_backup_YYYYMMDD_HHMMSS.sql
```

### Restore compressed backup
```bash
gunzip -c backups/fayo_backup_YYYYMMDD_HHMMSS.sql.gz | psql -U postgres -d fayo
```

## Quick One-Liner (Recommended)
```bash
mkdir -p backups && docker exec -t postgres pg_dump -U postgres -d fayo > backups/fayo_backup_$(date +%Y%m%d_%H%M%S).sql && echo "✅ Backup created: backups/fayo_backup_*.sql"
```

