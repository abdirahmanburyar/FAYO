# Quick Start: Create Admin User

## 🚀 Fastest Method

After your containers are running, execute:

```bash
docker compose -f docker-compose.prod.yml exec api-service node /app/scripts/create-admin.js
```

## 📋 Default Credentials

After running the script, you'll get:

- **Username:** `0001`
- **Password:** `admin123`
- **Email:** `admin@fayo.com`

## 🔧 Custom Credentials

To create an admin with custom credentials:

```bash
docker compose -f docker-compose.prod.yml exec \
  -e ADMIN_USERNAME=myadmin \
  -e ADMIN_PASSWORD=SecurePass123! \
  -e ADMIN_EMAIL=myadmin@fayo.com \
  -e ADMIN_FIRST_NAME=John \
  -e ADMIN_LAST_NAME=Doe \
  api-service node /app/scripts/create-admin.js
```

## ✅ Verify Admin Was Created

Check if admin exists:

```bash
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d fayo -c "SELECT username, email, role FROM users.users WHERE role='ADMIN';"
```

## 🔐 Test Login

Test the admin login:

```bash
curl -X POST http://localhost:3001/api/v1/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"0001","password":"admin123"}'
```

Or if using external IP:

```bash
curl -X POST http://72.62.51.50:3001/api/v1/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"0001","password":"admin123"}'
```

## ⚠️ Important Notes

1. **Change the default password** after first login for security
2. The script will **not create a duplicate** if an admin already exists
3. Make sure the **api-service container is running** before executing
4. The script requires the **database to be initialized** (migrations run)

## 🐛 Troubleshooting

### Container not found
```bash
# Check if api-service is running
docker compose -f docker-compose.prod.yml ps
```

### Database connection error
```bash
# Check if postgres is healthy
docker compose -f docker-compose.prod.yml ps postgres

# Check database connection
docker compose -f docker-compose.prod.yml exec api-service node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.\$connect().then(()=>{console.log('✅ Connected');p.\$disconnect();}).catch(e=>{console.error('❌ Error:',e.message);process.exit(1);});"
```

### Username/Email already exists
The script will detect if the username or email is already taken and exit with an error. Choose different credentials or update the existing user.

