# Database Migration Guide

This guide explains how to move your entire database from the old VPS (`31.97.58.62`) to the new VPS (`72.62.51.50`).

## Prerequisites
- **Old VPS** must be running and accessible via SSH.
- **New VPS** must have Docker running and the `postgres` container started (by running `docker-compose up -d postgres`).

## Step 1: Dump Data from Old VPS
Run this command on your **local machine** to dump the database directly to a file on your computer:

```bash
# ssh into old VPS and dump database
ssh root@31.97.58.62 "docker exec -t postgres pg_dumpall -c -U postgres" > fayo_full_backup.sql
```

*Note: If your SSH requires a password, you might need to run the command inside the VPS instead:*
```bash
# Option B: Run INSIDE Old VPS
ssh root@31.97.58.62
docker exec -t postgres pg_dumpall -c -U postgres > dump.sql
exit
# Then copy it to local machine
scp root@31.97.58.62:~/dump.sql ./fayo_full_backup.sql
```

## Step 2: Restore Data to New VPS
Now, restore this file to the new server.

```bash
# 1. Copy the dump file to the new VPS
scp fayo_full_backup.sql root@72.62.51.50:~/dump.sql

# 2. SSH into new VPS
ssh root@72.62.51.50

# 3. Stop application services (keep postgres running)
cd /root/fayo
docker-compose -f docker-compose.prod.yml stop user-service hospital-service doctor-service appointment-service payment-service specialty-service

# 4. Restore the database
# Warning: This will overwrite any existing data on the new server!
cat ~/dump.sql | docker exec -i postgres psql -U postgres

# 5. Restart everything
docker-compose -f docker-compose.prod.yml restart
```

## Troubleshooting
- **Error: "role postgres does not exist"**: The dump includes role creation. If `postgres` user already exists, ignore this error.
- **Connection refused**: Ensure the `postgres` container is running on the target machine (`docker ps`).

