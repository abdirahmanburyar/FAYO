const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Default admin credentials
    const username = process.env.ADMIN_USERNAME || '0001';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const email = process.env.ADMIN_EMAIL || 'admin@fayo.com';
    const firstName = process.env.ADMIN_FIRST_NAME || 'System';
    const lastName = process.env.ADMIN_LAST_NAME || 'Administrator';

    console.log('🔍 Checking for existing admin user...');
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
      },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      return;
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        console.error(`❌ Username "${username}" is already taken`);
        process.exit(1);
      }
      if (existingUser.email === email) {
        console.error(`❌ Email "${email}" is already taken`);
        process.exit(1);
      }
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('👤 Creating admin user...');
    const admin = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'ADMIN',
        userType: 'HOSPITAL_MANAGER',
        isActive: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📋 Admin Credentials:');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log('');
    console.log('⚠️  Please change the default password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 'P2002') {
      console.error('   A user with this username or email already exists');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

