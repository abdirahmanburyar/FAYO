import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { DatabaseModule } from './common/database/database.module';
import { RedisModule } from './common/redis/redis.module';
import { SpecialtyServiceModule } from './common/specialty-service/specialty-service.module';
import { DoctorsModule } from './doctors/doctors.module';
import { HealthController } from './health/health.controller';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    RedisModule,
    SpecialtyServiceModule,
    DoctorsModule,
    UploadModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
