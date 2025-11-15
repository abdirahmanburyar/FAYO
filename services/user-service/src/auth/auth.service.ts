import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OtpService } from '../otp/otp.service';
import { LoginWithOtpDto, RegisterDto, LoginWithPasswordDto } from './dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
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
      role: userData.role || 'PATIENT', // Default to PATIENT if not provided
      userType: userData.userType || 'PATIENT', // Default to PATIENT if not provided
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


  // Login with username/password
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
      expires_in: 3600, // 1 hour
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

  // Validate user credentials for local strategy
  async validateUserCredentials(phone: string, password: string): Promise<any> {
    // Try to find user by phone first, then by username
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

  // Validate user from JWT payload
  async validateUser(payload: any) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }

  // Refresh token
  async refreshToken(refreshToken: string) {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken);
      
      // Find user
      const user = await this.usersService.findOne(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
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
        expires_in: 3600, // 1 hour
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

  // Admin login with username/password
  async adminLogin(username: string, password: string) {
    // Find admin user by username (numeric username)
    const user = await this.usersService.findByUsername(username);
    
    if (!user) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      throw new UnauthorizedException('Access denied. Admin privileges required.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // Generate JWT tokens
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
      expires_in: 3600, // 1 hour
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

  // Hash password
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
