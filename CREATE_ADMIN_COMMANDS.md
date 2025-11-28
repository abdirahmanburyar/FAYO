# Create Admin User - Docker Commands

## Quick Command (Recommended)

Run this command on your VPS to create the admin user:

```bash
docker compose -f docker-compose.prod.yml exec -T user-service node -e "const {PrismaClient}=require('@prisma/client');const bcrypt=require('bcryptjs');const p=new PrismaClient();(async()=>{try{const e=await p.user.findFirst({where:{role:'ADMIN'}});if(e){console.log('✅ Admin exists:',e.username);}else{const h=await bcrypt.hash('admin123',10);const a=await p.user.create({data:{username:'0001',email:'admin@fayo.com',password:h,firstName:'System',lastName:'Administrator',role:'ADMIN',userType:'HOSPITAL_MANAGER',isActive:true}});console.log('✅ Admin created! Username: 0001, Password: admin123');}}catch(e){console.error('⚠️ Error:',e.message);}finally{await p.\$disconnect();}})();"
```

## Alternative: Using Docker Exec (if file exists)

```bash
docker compose -f docker-compose.prod.yml exec -T user-service node /app/create-admin-manual.js
```

Or if using docker directly:
```bash
docker exec -T user-service node /app/create-admin-manual.js
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
   docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d user_service -c "SELECT username, email, role FROM users.users WHERE role='ADMIN';"
   ```

2. **Check user-service logs:**
   ```bash
   docker compose -f docker-compose.prod.yml logs user-service --tail 50
   ```

3. **Check admin-panel logs:**
   ```bash
   docker compose -f docker-compose.prod.yml logs admin-panel --tail 50
   ```

4. **Verify user-service is accessible:**
   ```bash
   curl http://31.97.58.62:3001/api/v1/health
   ```

5. **Test admin login directly:**
   ```bash
   curl -X POST http://31.97.58.62:3001/api/v1/auth/admin-login \
     -H "Content-Type: application/json" \
     -d '{"username":"0001","password":"admin123"}'
   ```

6. **Check environment variables:**
   - Make sure `USER_SERVICE_URL` is set correctly in admin-panel
   - In production, it should be `http://user-service:3001` (internal) or `http://31.97.58.62:3001` (external)

