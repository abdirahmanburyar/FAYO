import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { OtpService } from '../otp/otp.service';
import { LoginWithOtpDto, RegisterDto, LoginWithPasswordDto } from './dto';
import * as bcrypt from 'bcryptjs';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async loginWithOtp(loginWithOtpDto: LoginWithOtpDto) {
    const { phone, code } = loginWithOtpDto;
    
    // Verify OTP
    const isOtpValid = await this.otpService.verifyOtp(phone, code);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Find user (should already exist from OTP generation)
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new UnauthorizedException('User not found. Please request OTP again.');
    }

    // Generate JWT tokens
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600, // 1 hour
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { phone, code, ...userData } = registerDto;
    
    // Verify OTP
    const isOtpValid = await this.otpService.verifyOtp(phone, code);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Check if user already exists
    const existingUser = await this.usersService.findByPhone(phone);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Create user with default values for required fields
    const user = await this.usersService.create({
      phone,
      role: userData.role || 'PATIENT',
      userType: userData.userType || 'PATIENT',
      ...userData,
    });

    // Generate JWT tokens
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async loginWithPassword(loginWithPasswordDto: LoginWithPasswordDto) {
    const { phone, password } = loginWithPasswordDto;
    
    // Find user by phone or username
    let user = await this.usersService.findByPhone(phone);
    if (!user) {
      user = await this.usersService.findByUsername(phone);
    }
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT tokens
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        email: user.email,
      },
    };
  }

  async validateUserCredentials(phone: string, password: string): Promise<any> {
    let user = await this.usersService.findByPhone(phone);
    if (!user) {
      user = await this.usersService.findByUsername(phone);
    }
    
    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async validateUser(payload: any) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findOne(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = {
        sub: user.id,
        phone: user.phone,
        role: user.role,
      };

      const newAccessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_in: 3600,
        user: {
          id: user.id,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async adminLogin(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    
    if (!user) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    if (user.role !== 'ADMIN') {
      throw new UnauthorizedException('Access denied. Admin privileges required.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      expires_in: 3600,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async hospitalLogin(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if password is hashed or plain text
    const isBcryptHash = user.password.startsWith('$2') && user.password.length === 60;
    
    let isPasswordValid = false;
    
    if (isBcryptHash) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plain text password
      isPasswordValid = password === user.password;
      
      // Migrate to hashed password if valid
      if (isPasswordValid) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.usersService.update(user.id, { password: hashedPassword });
      }
    }
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check hospital association - Note: In monolithic, we'll need to check directly
    // For now, we'll check if user role is HOSPITAL or CLINIC
    if (user.role !== 'HOSPITAL' && user.role !== 'CLINIC') {
      throw new UnauthorizedException('Access denied. You must be associated with a hospital or clinic.');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      expires_in: 3600,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}

