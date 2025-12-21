# Create Admin User - Docker Commands

## Quick Command (Recommended)

Run this command to create the admin user in the api-service container:

```bash
docker compose -f docker-compose.prod.yml exec api-service node /app/scripts/create-admin.js
```

Or using the shell script:
```bash
docker compose -f docker-compose.prod.yml exec api-service /app/scripts/create-admin.sh
```

## Alternative: One-liner Command

If you prefer a one-liner without the script file:

```bash
docker compose -f docker-compose.prod.yml exec -T api-service node -e "const {PrismaClient}=require('@prisma/client');const bcrypt=require('bcryptjs');const p=new PrismaClient();(async()=>{try{const e=await p.user.findFirst({where:{role:'ADMIN'}});if(e){console.log('✅ Admin exists:',e.username);}else{const h=await bcrypt.hash('admin123',10);const a=await p.user.create({data:{username:'0001',email:'admin@fayo.com',password:h,firstName:'System',lastName:'Administrator',role:'ADMIN',userType:'HOSPITAL_MANAGER',isActive:true}});console.log('✅ Admin created! Username: 0001, Password: admin123');}}catch(e){console.error('⚠️ Error:',e.message);}finally{await p.\$disconnect();}})();"
```

## Custom Admin Credentials

You can set custom credentials using environment variables:

```bash
docker compose -f docker-compose.prod.yml exec -e ADMIN_USERNAME=myadmin -e ADMIN_PASSWORD=mypassword -e ADMIN_EMAIL=myadmin@fayo.com api-service node /app/scripts/create-admin.js
```

## Default Admin Credentials

- **Username:** `0001`
- **Password:** `admin123`
- **Email:** `admin@fayo.com`
- **Role:** `ADMIN`

## Troubleshooting Login Issues

If you get "Internal server error" when logging in:

1. **Check if admin user exists:**
   ```bash
   docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d fayo -c "SELECT username, email, role FROM users.users WHERE role='ADMIN';"
   ```

2. **Check api-service logs:**
   ```bash
   docker compose -f docker-compose.prod.yml logs api-service --tail 50
   ```

3. **Check admin-panel logs:**
   ```bash
   docker compose -f docker-compose.prod.yml logs admin-panel --tail 50
   ```

4. **Verify api-service is accessible:**
   ```bash
   curl http://72.62.51.50:3001/api/v1/health
   ```

5. **Test admin login directly:**
   ```bash
   curl -X POST http://72.62.51.50:3001/api/v1/auth/admin-login \
     -H "Content-Type: application/json" \
     -d '{"username":"0001","password":"admin123"}'
   ```

6. **Check environment variables:**
   - Make sure `API_SERVICE_URL` is set correctly in admin-panel
   - In production, it should be `http://api-service:3001` (internal) or `http://72.62.51.50:3001` (external)

7. **Verify database connection:**
   ```bash
   docker compose -f docker-compose.prod.yml exec api-service node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.\$connect().then(()=>{console.log('✅ Database connected');p.\$disconnect();}).catch(e=>{console.error('❌ Database error:',e.message);process.exit(1);});"
   ```

