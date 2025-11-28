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

  // Hospital/Clinic login with username/password
  async hospitalLogin(username: string, password: string) {
    console.log(`[HOSPITAL-LOGIN] Starting hospital login for username: ${username}`);
    
    // Find user by username (numeric username)
    console.log(`[HOSPITAL-LOGIN] Looking up user by username: ${username}`);
    const user = await this.usersService.findByUsername(username);
    
    if (!user) {
      console.log(`[HOSPITAL-LOGIN] ❌ User not found for username: ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(`[HOSPITAL-LOGIN] ✅ User found: ID=${user.id}, Username=${user.username}, Role=${user.role}, Email=${user.email}`);

    // Check if user has a password set
    if (!user.password) {
      console.log(`[HOSPITAL-LOGIN] ❌ User ${user.id} has no password set`);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(`[HOSPITAL-LOGIN] User has password set, verifying password...`);

    // Check if password is stored as plain text (not a bcrypt hash)
    // Bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long
    const isBcryptHash = user.password.startsWith('$2') && user.password.length === 60;
    
    let isPasswordValid = false;
    
    if (isBcryptHash) {
      // Password is hashed, use bcrypt.compare
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Password is stored as plain text (legacy user), compare directly
      console.log(`[HOSPITAL-LOGIN] ⚠️ User ${user.id} has plain text password, migrating to hashed password...`);
      isPasswordValid = password === user.password;
      
      // If password matches, hash it and update the user
      if (isPasswordValid) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.usersService.update(user.id, { password: hashedPassword });
        console.log(`[HOSPITAL-LOGIN] ✅ Password migrated to hashed format for user ${user.id}`);
      }
    }
    
    if (!isPasswordValid) {
      console.log(`[HOSPITAL-LOGIN] ❌ Invalid password for user ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(`[HOSPITAL-LOGIN] ✅ Password verified for user ${user.id}`);

    // Check if user belongs to a hospital or clinic
    const hospitalServiceUrl = this.configService.get('HOSPITAL_SERVICE_URL') || 'http://localhost:3002';
    const hospitalUrl = `${hospitalServiceUrl}/api/v1/hospitals/by-user/${user.id}`;
    
    console.log(`[HOSPITAL-LOGIN] Checking hospital association...`);
    console.log(`[HOSPITAL-LOGIN] Hospital Service URL: ${hospitalServiceUrl}`);
    console.log(`[HOSPITAL-LOGIN] Hospital URL: ${hospitalUrl}`);
    
    try {
      console.log(`[HOSPITAL-LOGIN] Making request to hospital service...`);
      const hospitalResponse = await axios.get(hospitalUrl, {
        timeout: 5000, // 5 second timeout
      });

      console.log(`[HOSPITAL-LOGIN] ✅ Hospital service responded with status: ${hospitalResponse.status}`);

      // User belongs to a hospital/clinic
      const hospital = hospitalResponse.data;
      console.log(`[HOSPITAL-LOGIN] ✅ User ${user.id} is associated with hospital/clinic: ID=${hospital.id}, Name=${hospital.name || 'N/A'}, Type=${hospital.type || 'N/A'}`);

      // Generate JWT tokens
      console.log(`[HOSPITAL-LOGIN] Generating JWT tokens for user ${user.id}...`);
      const payload = {
        sub: user.id,
        username: user.username,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      console.log(`[HOSPITAL-LOGIN] ✅ Successfully generated tokens for user ${user.id}`);
      console.log(`[HOSPITAL-LOGIN] ✅ Hospital login successful for user ${user.id}`);

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
        hospital: hospital,
      };
    } catch (error) {
      console.error(`[HOSPITAL-LOGIN] ❌ Error checking hospital association for user ${user.id}`);
      
      // If hospital not found or service unavailable
      if (error.response) {
        console.error(`[HOSPITAL-LOGIN] Hospital service HTTP error: Status=${error.response.status}, StatusText=${error.response.statusText}`);
        console.error(`[HOSPITAL-LOGIN] Response data:`, JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 404) {
          console.log(`[HOSPITAL-LOGIN] ❌ User ${user.id} is not associated with any hospital/clinic`);
          throw new UnauthorizedException('Access denied. You must be associated with a hospital or clinic to access this panel.');
        }
        if (error.response.status === 401 || error.response.status === 403) {
          console.log(`[HOSPITAL-LOGIN] ❌ Hospital service authentication/authorization error`);
          throw new UnauthorizedException('Access denied. Unable to verify hospital association.');
        }
      }
      
      // Log other errors
      if (error.code) {
        console.error(`[HOSPITAL-LOGIN] Error code: ${error.code}`);
      }
      if (error.message) {
        console.error(`[HOSPITAL-LOGIN] Error message: ${error.message}`);
      }
      if (error.stack) {
        console.error(`[HOSPITAL-LOGIN] Error stack:`, error.stack);
      }
      
      if (error.code === 'ECONNREFUSED') {
        console.error(`[HOSPITAL-LOGIN] ❌ Cannot connect to hospital service at ${hospitalServiceUrl}`);
        throw new UnauthorizedException('Hospital service unavailable. Please try again later.');
      }
      if (error.code === 'ETIMEDOUT') {
        console.error(`[HOSPITAL-LOGIN] ❌ Hospital service request timed out`);
        throw new UnauthorizedException('Hospital service timeout. Please try again later.');
      }
      
      console.error(`[HOSPITAL-LOGIN] ❌ Unknown error checking hospital association`);
      throw new UnauthorizedException('Unable to verify hospital association. Please try again later.');
    }
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
