# Prisma Migrations - Inline Docker Commands

This guide shows how to run Prisma migrations manually in production using inline Docker commands.

## Prerequisites
- All services must be running
- Database must be accessible from the containers
- Prisma CLI is installed in each service container

---

## 1. User Service Migrations

```bash
# Run migrations
docker exec -it fayo-user-service npx prisma migrate deploy

# Or use db push (if migrations don't exist)
docker exec -it fayo-user-service npx prisma db push --accept-data-loss

# Check migration status
docker exec -it fayo-user-service npx prisma migrate status

# Generate Prisma client (if needed)
docker exec -it fayo-user-service npx prisma generate
```

## 2. Hospital Service Migrations

```bash
# Run migrations
docker exec -it fayo-hospital-service npx prisma migrate deploy

# Or use db push
docker exec -it fayo-hospital-service npx prisma db push --accept-data-loss

# Check migration status
docker exec -it fayo-hospital-service npx prisma migrate status
```

## 3. Doctor Service Migrations

```bash
# Run migrations
docker exec -it fayo-doctor-service npx prisma migrate deploy

# Or use db push
docker exec -it fayo-doctor-service npx prisma db push --accept-data-loss

# Check migration status
docker exec -it fayo-doctor-service npx prisma migrate status
```

## 4. Shared Service Migrations

```bash
# Run migrations
docker exec -it fayo-shared-service npx prisma migrate deploy

# Or use db push
docker exec -it fayo-shared-service npx prisma db push --accept-data-loss

# Check migration status
docker exec -it fayo-shared-service npx prisma migrate status
```

---

## Run All Migrations at Once

```bash
# Run migrations for all services
docker exec -it fayo-user-service npx prisma migrate deploy && \
docker exec -it fayo-hospital-service npx prisma migrate deploy && \
docker exec -it fayo-doctor-service npx prisma migrate deploy && \
docker exec -it fayo-shared-service npx prisma migrate deploy
```

---

## Alternative: Using db push (for development/quick setup)

If migrations don't exist or you want to sync schema directly:

```bash
# User Service
docker exec -it fayo-user-service npx prisma db push --accept-data-loss --skip-generate

# Hospital Service
docker exec -it fayo-hospital-service npx prisma db push --accept-data-loss --skip-generate

# Doctor Service
docker exec -it fayo-doctor-service npx prisma db push --accept-data-loss --skip-generate

# Shared Service
docker exec -it fayo-shared-service npx prisma db push --accept-data-loss --skip-generate
```

---

## Troubleshooting

### If Prisma CLI is not found:
```bash
# Install Prisma in the container
docker exec -it fayo-user-service npm install prisma --save-prod
```

### If database connection fails:
```bash
# Check environment variables
docker exec -it fayo-user-service env | grep DATABASE_URL

# Test database connection
docker exec -it fayo-user-service npx prisma db execute --stdin <<< "SELECT 1;"
```

### If migrations are stuck:
```bash
# Reset failed migrations (use with caution!)
docker exec -it fayo-user-service npx prisma migrate resolve --rolled-back <migration_name>
```

---

## Verify Migrations

```bash
# Check all migration statuses
echo "=== User Service ===" && docker exec -it fayo-user-service npx prisma migrate status && \
echo "=== Hospital Service ===" && docker exec -it fayo-hospital-service npx prisma migrate status && \
echo "=== Doctor Service ===" && docker exec -it fayo-doctor-service npx prisma migrate status && \
echo "=== Shared Service ===" && docker exec -it fayo-shared-service npx prisma migrate status
```

---

## Quick Reference

| Service | Container Name | Schema |
|---------|---------------|--------|
| User Service | `fayo-user-service` | `users` |
| Hospital Service | `fayo-hospital-service` | `hospitals` |
| Doctor Service | `fayo-doctor-service` | `doctors` |
| Shared Service | `fayo-shared-service` | `shared` |

---

## Notes

- `migrate deploy` - Applies pending migrations (production-safe)
- `db push` - Syncs schema directly without migrations (development)
- `--accept-data-loss` - Allows schema changes that may cause data loss
- `--skip-generate` - Skips Prisma client generation (faster)

