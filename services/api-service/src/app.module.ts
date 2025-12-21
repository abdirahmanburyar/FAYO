import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_FILTER } from '@nestjs/core';

// Common modules
import { DatabaseModule } from './common/database/database.module';
import { RedisModule } from './common/redis/redis.module';
import { RabbitMQModule } from './common/rabbitmq/rabbitmq.module';
import { WebsocketModule } from './common/websocket/websocket.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { HealthController } from './health/health.controller';

// Feature modules
import { SpecialtiesModule } from './specialties/specialties.module';
import { AdsModule } from './ads/ads.module';
import { UploadModule } from './upload/upload.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OtpModule } from './otp/otp.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PaymentsModule } from './payments/payments.module';
import { HospitalsModule } from './hospitals/hospitals.module';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    // Common modules
    DatabaseModule,
    RedisModule,
    RabbitMQModule,
    WebsocketModule,
    // Feature modules
    SpecialtiesModule,
    AdsModule,
    UploadModule,
    AuthModule,
    UsersModule,
    OtpModule,
    DoctorsModule,
    PaymentsModule,
    HospitalsModule,
    AppointmentsModule,
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

