#!/bin/sh
set -e

echo "⏳ Waiting for database to be ready..."
# Wait for database connection (max 30 seconds)
timeout=30
counter=0
until node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ Database connected'); process.exit(0); }).catch(() => { process.exit(1); });" 2>/dev/null; do
  counter=$((counter + 1))
  if [ $counter -ge $timeout ]; then
    echo "❌ Database connection timeout after ${timeout} seconds"
    exit 1
  fi
  echo "   Waiting for database... ($counter/$timeout)"
  sleep 1
done

echo "🗄️ Running Prisma migrations..."
# Ensure the users schema exists before running migrations
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    await prisma.\$executeRaw\`CREATE SCHEMA IF NOT EXISTS users;\`;
    console.log('✅ Schema users created or already exists');
  } catch (error) {
    console.error('⚠️ Error creating schema:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
"

# Run migrations with proper error handling
if npx prisma migrate deploy; then
  echo "✅ Migrations applied successfully"
else
  echo "❌ Migration failed - check logs above"
  echo "⚠️ Continuing anyway, but database may not be properly initialized"
fi

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

