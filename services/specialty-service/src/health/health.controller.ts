import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        service: 'specialty-service',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        service: 'specialty-service',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

