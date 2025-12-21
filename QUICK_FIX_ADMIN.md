# Quick Fix: Create Admin Without Rebuilding

Since the script wasn't in the container when it was built, here are two quick solutions:

## Option 1: Copy Script into Running Container (Fastest)

```bash
# Copy the script from your local machine into the container
docker cp services/api-service/scripts/create-admin.js api-service:/app/scripts/create-admin.js

# Then run it
docker compose -f docker-compose.prod.yml exec api-service node /app/scripts/create-admin.js
```

## Option 2: One-Liner Command (No Script Needed)

Run this directly without needing the script file:

```bash
docker compose -f docker-compose.prod.yml exec -T api-service node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
  try {
    const username = '0001';
    const password = 'admin123';
    const email = 'admin@fayo.com';
    
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existingAdmin) {
      console.log('✅ Admin exists:', existingAdmin.username);
      await prisma.\$disconnect();
      return;
    }
    
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });
    
    if (existingUser) {
      console.error('❌ Username or email already taken');
      await prisma.\$disconnect();
      process.exit(1);
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        userType: 'HOSPITAL_MANAGER',
        isActive: true,
      },
    });
    
    console.log('✅ Admin created!');
    console.log('Username:', admin.username);
    console.log('Password:', password);
    console.log('Email:', admin.email);
    await prisma.\$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.\$disconnect();
    process.exit(1);
  }
})();
"
```

## Option 3: Rebuild Container (For Future Use)

If you want the script permanently in the container:

```bash
# Rebuild the api-service
docker compose -f docker-compose.prod.yml build api-service

# Restart the service
docker compose -f docker-compose.prod.yml up -d api-service

# Then run the script
docker compose -f docker-compose.prod.yml exec api-service node /app/scripts/create-admin.js
```

## Recommended: Use Option 2 (One-Liner)

The one-liner is the fastest and doesn't require file copying or rebuilding.

