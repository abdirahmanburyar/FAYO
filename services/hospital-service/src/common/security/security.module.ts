import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { SecurityMiddleware } from './security.middleware';

@Module({})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*');
  }
}
