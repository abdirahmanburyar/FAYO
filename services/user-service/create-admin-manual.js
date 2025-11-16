const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

(async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log('   Username:', existingAdmin.username);
      console.log('   Email:', existingAdmin.email);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
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
    console.log('   Username: 0001');
    console.log('   Password: admin123');
    console.log('   Email: admin@fayo.com');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();

