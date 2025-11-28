import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Hash password if provided
      let hashedPassword: string | undefined;
      if (createUserDto.password) {
        const saltRounds = 10;
        hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);
        console.log('✅ [USER] Password hashed successfully');
      }

      // Convert dateOfBirth string to Date object if provided
      const data = {
        ...createUserDto,
        password: hashedPassword, // Use hashed password instead of plain text
        dateOfBirth: createUserDto.dateOfBirth ? new Date(createUserDto.dateOfBirth) : undefined,
      };

      // Don't log the password (even hashed) in production
      const logData = { ...data };
      if (logData.password) {
        logData.password = '[HASHED]';
      }
      console.log('Creating user with data:', logData);

      // Check for existing users with same email, phone, or username
      console.log('🔍 [USER] Checking for existing users with same credentials...');
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            ...(data.email ? [{ email: data.email }] : []),
            ...(data.phone ? [{ phone: data.phone }] : []),
            ...(data.username ? [{ username: data.username }] : []),
          ],
        },
      });

      if (existingUser) {
        console.log('❌ [USER] Found existing user:', {
          id: existingUser.id,
          email: existingUser.email,
          phone: existingUser.phone,
          username: existingUser.username
        });
        
        if (existingUser.email === data.email) {
          console.error('❌ [USER] Email conflict:', data.email);
          throw new ConflictException('A user with this email already exists');
        }
        if (existingUser.phone === data.phone) {
          console.error('❌ [USER] Phone conflict:', data.phone);
          throw new ConflictException('A user with this phone number already exists');
        }
        if (existingUser.username === data.username) {
          console.error('❌ [USER] Username conflict:', data.username);
          throw new ConflictException('A user with this username already exists');
        }
      } else {
        console.log('✅ [USER] No existing user found, proceeding with creation...');
      }

      const newUser = await this.prisma.user.create({
        data,
      });
      
      console.log('✅ [USER] User created successfully:', {
        id: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        username: newUser.username,
        role: newUser.role,
        userType: newUser.userType
      });
      
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Handle Prisma unique constraint errors as fallback
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (Array.isArray(target)) {
          if (target.includes('email')) {
            throw new ConflictException('A user with this email already exists');
          }
          if (target.includes('phone')) {
            throw new ConflictException('A user with this phone number already exists');
          }
          if (target.includes('username')) {
            throw new ConflictException('A user with this username already exists');
          }
        }
        throw new ConflictException('A user with this information already exists');
      }
      
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { isActive: true },
    });
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, isActive: true },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { phone, isActive: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, isActive: true },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { username, isActive: true },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Hash password if provided
    let hashedPassword: string | undefined;
    if (updateUserDto.password) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(updateUserDto.password, saltRounds);
      console.log('✅ [USER] Password hashed for update');
    }

    // Convert dateOfBirth string to Date object if provided
    const data = {
      ...updateUserDto,
      password: hashedPassword || updateUserDto.password, // Use hashed password if provided
      dateOfBirth: updateUserDto.dateOfBirth ? new Date(updateUserDto.dateOfBirth) : undefined,
    };

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findDoctorsBySpecialty(specialty: string): Promise<User[]> {
    // Note: Doctor profiles are now managed by the doctor-service
    // This method is kept for backward compatibility but returns empty array
    console.warn('findDoctorsBySpecialty: This method has been moved to doctor-service');
    return [];
  }

  async getUserProfile(userId: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        userType: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        // Note: Doctor profile data moved to doctor-service
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
    };
  }

  async updateUserProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<any> {
    console.log('🔍 [USERS] Starting profile update...');
    console.log('   👤 User ID:', userId);
    console.log('   📦 Update Data:', updateProfileDto);
    
    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
    });

    if (!existingUser) {
      console.log('❌ [USERS] User not found:', userId);
      throw new NotFoundException('User not found');
    }

    console.log('✅ [USERS] User found:', existingUser.id);

    // Check if phone number is being updated and if it's already taken
    if (updateProfileDto.phone && updateProfileDto.phone !== existingUser.phone) {
      const phoneExists = await this.prisma.user.findFirst({
        where: { 
          phone: updateProfileDto.phone, 
          id: { not: userId },
          isActive: true 
        },
      });

      if (phoneExists) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // Check if email is being updated and if it's already taken
    if (updateProfileDto.email && updateProfileDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: { 
          email: updateProfileDto.email, 
          id: { not: userId },
          isActive: true 
        },
      });

      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }

    // Update user profile
    console.log('🔄 [USERS] Updating user profile in database...');
    try {
      // Convert dateOfBirth string to Date object if provided
      const updateData: any = { ...updateProfileDto };
      if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
        console.log('📅 [USERS] Converted dateOfBirth:', updateData.dateOfBirth);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          userType: true,
          dateOfBirth: true,
          gender: true,
          address: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      console.log('✅ [USERS] Profile updated successfully:', updatedUser.id);
      return {
        ...updatedUser,
        fullName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || 'User',
      };
    } catch (error) {
      console.error('❌ [USERS] Database update error:', error);
      throw error;
    }
  }
}
