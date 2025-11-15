import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginWithOtpDto, LoginWithPasswordDto, RegisterDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login/otp')
  async loginWithOtp(@Body() loginWithOtpDto: LoginWithOtpDto) {
    return this.authService.loginWithOtp(loginWithOtpDto);
  }

  @Post('login/password')
  async loginWithPassword(@Body() loginWithPasswordDto: LoginWithPasswordDto) {
    return this.authService.loginWithPassword(loginWithPasswordDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('admin-login')
  async adminLogin(@Body() body: { username: string; password: string }) {
    return this.authService.adminLogin(body.username, body.password);
  }
}
