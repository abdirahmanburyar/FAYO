import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username);
      return;
    }

    // Create admin user
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

    console.log('Admin user created successfully:');
    console.log('Username:', admin.username);
    console.log('Password: admin123');
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
