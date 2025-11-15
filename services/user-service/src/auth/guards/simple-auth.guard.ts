import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class SimpleAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.substring(7);
    console.log('🔍 [SIMPLE-AUTH] Processing token:', token.substring(0, 20) + '...');

    try {
      // For now, just validate that the token exists and is not empty
      if (!token || token.length < 10) {
        throw new UnauthorizedException('Invalid token');
      }

      console.log('✅ [SIMPLE-AUTH] Token validation successful');
      
      // Create a mock user object for testing
      request.user = {
        id: 'mock-user-id',
        phone: '+252611234567',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        email: 'test@example.com',
      };

      return true;
    } catch (error) {
      console.log('❌ [SIMPLE-AUTH] Authentication failed:', error.message);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
