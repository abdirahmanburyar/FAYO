import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './common/database/database.module';
import { RedisModule } from './common/redis/redis.module';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { SecurityModule } from './common/security/security.module';
import { AuthModule } from './auth/auth.module';
import { HospitalsModule } from './hospitals/hospitals.module';
import { HospitalDoctorsModule } from './hospital-doctors/hospital-doctors.module';
import { HealthController } from './health/health.controller';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    RedisModule,
    RateLimitModule,
    SecurityModule,
    AuthModule,
    HospitalsModule,
    HospitalDoctorsModule,
    UploadModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
