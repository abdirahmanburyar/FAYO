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
      }

      // Convert dateOfBirth string to Date object if provided
      const data = {
        ...createUserDto,
        password: hashedPassword,
        dateOfBirth: createUserDto.dateOfBirth ? new Date(createUserDto.dateOfBirth) : undefined,
      };

      // Check for existing users with same email, phone, or username
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
        if (existingUser.email === data.email) {
          throw new ConflictException('A user with this email already exists');
        }
        if (existingUser.phone === data.phone) {
          throw new ConflictException('A user with this phone number already exists');
        }
        if (existingUser.username === data.username) {
          throw new ConflictException('A user with this username already exists');
        }
      }

      const newUser = await this.prisma.user.create({
        data,
      });
      
      return newUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
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
      const existingUser = await this.prisma.user.findFirst({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // Protect admin user with username "0001"
      if (existingUser.username === '0001') {
        if (updateUserDto.role && updateUserDto.role !== existingUser.role) {
          throw new BadRequestException('Cannot change the role of the protected admin user (username: 0001)');
        }
        if (updateUserDto.username && updateUserDto.username !== '0001') {
          throw new BadRequestException('Cannot change the username of the protected admin user (username: 0001)');
        }
      }

      // Check for conflicts
      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        const emailExists = await this.prisma.user.findFirst({
          where: { email: updateUserDto.email, id: { not: id }, isActive: true },
        });
        if (emailExists) {
          throw new ConflictException('A user with this email already exists');
        }
      }

      if (updateUserDto.phone && updateUserDto.phone !== existingUser.phone) {
        const phoneExists = await this.prisma.user.findFirst({
          where: { phone: updateUserDto.phone, id: { not: id }, isActive: true },
        });
        if (phoneExists) {
          throw new ConflictException('A user with this phone number already exists');
        }
      }

      if (updateUserDto.username && updateUserDto.username !== existingUser.username) {
        const usernameExists = await this.prisma.user.findFirst({
          where: { username: updateUserDto.username, id: { not: id }, isActive: true },
        });
        if (usernameExists) {
          throw new ConflictException('A user with this username already exists');
        }
      }

      // Hash password if provided
      let hashedPassword: string | undefined;
      if (updateUserDto.password) {
        const saltRounds = 10;
        hashedPassword = await bcrypt.hash(updateUserDto.password, saltRounds);
      }

      // Prepare update data
      const updateData: any = {};
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
      
      if (updateUserDto.dateOfBirth !== undefined) {
        updateData.dateOfBirth = updateUserDto.dateOfBirth ? new Date(updateUserDto.dateOfBirth) : null;
      }
      
      if (hashedPassword) {
        updateData.password = hashedPassword;
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
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
      const existingUser = await this.prisma.user.findFirst({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // Protect admin user with username "0001"
      if (existingUser.username === '0001') {
        throw new BadRequestException('Cannot delete the protected admin user (username: 0001). This is a system account.');
      }

      const deletedUser = await this.prisma.user.update({
        where: { id },
        data: { 
          isActive: false,
          updatedAt: new Date(),
        },
      });

      return deletedUser;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw error;
    }
  }

  async findDoctorsBySpecialty(specialty: string): Promise<User[]> {
    // Note: Doctor profiles are now managed by the doctor-service
    // This method is kept for backward compatibility but returns empty array
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
    const existingUser = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check for conflicts
    if (updateProfileDto.phone && updateProfileDto.phone !== existingUser.phone) {
      const phoneExists = await this.prisma.user.findFirst({
        where: { phone: updateProfileDto.phone, id: { not: userId }, isActive: true },
      });
      if (phoneExists) {
        throw new ConflictException('Phone number already exists');
      }
    }

    if (updateProfileDto.email && updateProfileDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: { email: updateProfileDto.email, id: { not: userId }, isActive: true },
      });
      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }

    // Convert dateOfBirth string to Date object if provided
    const updateData: any = { ...updateProfileDto };
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
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

    return {
      ...updatedUser,
      fullName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || 'User',
    };
  }
}

