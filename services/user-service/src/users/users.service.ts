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
    try {
      console.log('🔍 [USER] Starting user update...');
      console.log('   👤 User ID:', id);
      console.log('   📦 Update Data:', { ...updateUserDto, password: updateUserDto.password ? '[PROVIDED]' : undefined });

      // Check if user exists
      const existingUser = await this.prisma.user.findFirst({
        where: { id },
      });

      if (!existingUser) {
        console.log('❌ [USER] User not found:', id);
        throw new NotFoundException('User not found');
      }

      console.log('✅ [USER] User found:', {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
        phone: existingUser.phone
      });

      // Protect admin user with username "0001" from critical changes
      if (existingUser.username === '0001') {
        // Allow updates but prevent role changes and username changes
        if (updateUserDto.role && updateUserDto.role !== existingUser.role) {
          throw new BadRequestException('Cannot change the role of the protected admin user (username: 0001)');
        }
        if (updateUserDto.username && updateUserDto.username !== '0001') {
          throw new BadRequestException('Cannot change the username of the protected admin user (username: 0001)');
        }
        console.log('⚠️ [USER] Protected admin user detected, applying restrictions');
      }

      // Check for conflicts if email is being updated
      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        const emailExists = await this.prisma.user.findFirst({
          where: {
            email: updateUserDto.email,
            id: { not: id },
            isActive: true,
          },
        });

        if (emailExists) {
          console.error('❌ [USER] Email conflict:', updateUserDto.email);
          throw new ConflictException('A user with this email already exists');
        }
      }

      // Check for conflicts if phone is being updated
      if (updateUserDto.phone && updateUserDto.phone !== existingUser.phone) {
        const phoneExists = await this.prisma.user.findFirst({
          where: {
            phone: updateUserDto.phone,
            id: { not: id },
            isActive: true,
          },
        });

        if (phoneExists) {
          console.error('❌ [USER] Phone conflict:', updateUserDto.phone);
          throw new ConflictException('A user with this phone number already exists');
        }
      }

      // Check for conflicts if username is being updated
      if (updateUserDto.username && updateUserDto.username !== existingUser.username) {
        const usernameExists = await this.prisma.user.findFirst({
          where: {
            username: updateUserDto.username,
            id: { not: id },
            isActive: true,
          },
        });

        if (usernameExists) {
          console.error('❌ [USER] Username conflict:', updateUserDto.username);
          throw new ConflictException('A user with this username already exists');
        }
      }

      // Hash password if provided
      let hashedPassword: string | undefined;
      if (updateUserDto.password) {
        const saltRounds = 10;
        hashedPassword = await bcrypt.hash(updateUserDto.password, saltRounds);
        console.log('✅ [USER] Password hashed for update');
      }

      // Prepare update data
      const updateData: any = {};
      
      // Only include fields that are provided
      if (updateUserDto.firstName !== undefined) updateData.firstName = updateUserDto.firstName;
      if (updateUserDto.lastName !== undefined) updateData.lastName = updateUserDto.lastName;
      if (updateUserDto.email !== undefined) updateData.email = updateUserDto.email;
      if (updateUserDto.phone !== undefined) updateData.phone = updateUserDto.phone;
      if (updateUserDto.username !== undefined) updateData.username = updateUserDto.username;
      if (updateUserDto.role !== undefined) updateData.role = updateUserDto.role;
      if (updateUserDto.userType !== undefined) updateData.userType = updateUserDto.userType;
      if (updateUserDto.isActive !== undefined) updateData.isActive = updateUserDto.isActive;
      if (updateUserDto.gender !== undefined) updateData.gender = updateUserDto.gender;
      if (updateUserDto.address !== undefined) updateData.address = updateUserDto.address;
      
      // Handle dateOfBirth
      if (updateUserDto.dateOfBirth !== undefined) {
        updateData.dateOfBirth = updateUserDto.dateOfBirth 
          ? new Date(updateUserDto.dateOfBirth) 
          : null;
      }
      
      // Handle password (only if provided)
      if (hashedPassword) {
        updateData.password = hashedPassword;
      }

      // Always update the updatedAt timestamp
      updateData.updatedAt = new Date();

      console.log('🔄 [USER] Updating user in database...');
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      console.log('✅ [USER] User updated successfully:', {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role
      });

      return updatedUser;
    } catch (error) {
      console.error('❌ [USER] Error updating user:', error);
      
      // Re-throw known exceptions
      if (error instanceof NotFoundException || 
          error instanceof ConflictException || 
          error instanceof BadRequestException) {
        throw error;
      }
      
      // Handle Prisma unique constraint errors
      if (error?.code === 'P2002') {
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

  async remove(id: string): Promise<User> {
    try {
      console.log('🔍 [USER] Starting user deletion (soft delete)...');
      console.log('   👤 User ID:', id);

      // Check if user exists
      const existingUser = await this.prisma.user.findFirst({
        where: { id },
      });

      if (!existingUser) {
        console.log('❌ [USER] User not found:', id);
        throw new NotFoundException('User not found');
      }

      // Protect admin user with username "0001" from deletion
      if (existingUser.username === '0001') {
        console.error('❌ [USER] Attempted to delete protected admin user:', existingUser.username);
        throw new BadRequestException('Cannot delete the protected admin user (username: 0001). This is a system account.');
      }

      console.log('✅ [USER] User found, proceeding with soft delete...');
      const deletedUser = await this.prisma.user.update({
        where: { id },
        data: { 
          isActive: false,
          updatedAt: new Date(),
        },
      });

      console.log('✅ [USER] User soft deleted successfully:', {
        id: deletedUser.id,
        username: deletedUser.username
      });

      return deletedUser;
    } catch (error) {
      console.error('❌ [USER] Error deleting user:', error);
      
      // Re-throw known exceptions
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw error;
    }
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
