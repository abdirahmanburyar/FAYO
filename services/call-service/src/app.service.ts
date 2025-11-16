import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  health() {
    return {
      status: 'ok',
      service: this.configService.get('SERVICE_NAME', 'call-service'),
      time: new Date().toISOString(),
    };
  }
}

