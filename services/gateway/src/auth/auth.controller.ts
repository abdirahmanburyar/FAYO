import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('keycloak/exchange')
  async exchangeKeycloakToken(@Body() body: { token: string }) {
    return this.authService.exchangeKeycloakToken(body.token);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('validate')
  async validateToken(@Body() body: { token: string }) {
    const user = await this.authService.validateJwtToken(body.token);
    return { valid: !!user, user };
  }
}
