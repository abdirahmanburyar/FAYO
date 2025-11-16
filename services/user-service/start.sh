#!/bin/sh
set -e

echo "🗄️ Running Prisma migrations..."
npx prisma migrate deploy || echo "⚠️ Migration failed or already applied"

echo "👤 Creating admin user if not exists..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists: ' + existingAdmin.username);
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = await prisma.user.create({
        data: {
          username: '0001',
          email: 'admin@fayo.com',
          password: hashedPassword,
          firstName: 'System',
          lastName: 'Administrator',
          role: 'ADMIN',
          userType: 'HOSPITAL_MANAGER',
          isActive: true,
        },
      });
      
      console.log('✅ Admin user created successfully!');
      console.log('📋 Admin Credentials:');
      console.log('   Username: ' + admin.username);
      console.log('   Password: admin123');
      console.log('   Email: ' + admin.email);
      console.log('⚠️  IMPORTANT: Change the default password after first login!');
    }
  } catch (error) {
    console.error('⚠️ Error creating admin user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
" || echo "⚠️ Admin creation failed (may already exist)"

echo "🚀 Starting application..."
exec node dist/main.js

