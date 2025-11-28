import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './common/database/database.module';
import { SpecialtiesModule } from './specialties/specialties.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // Increased limit for better performance
    }]),
    DatabaseModule,
    SpecialtiesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

