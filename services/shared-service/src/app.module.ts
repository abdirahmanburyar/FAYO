import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { SpecialtiesModule } from './specialties/specialties.module';
import { ServicesModule } from './services/services.module';
import { UtilitiesModule } from './utilities/utilities.module';
import { HealthModule } from './health/health.module';
import { MessageQueueModule } from './common/message-queue/message-queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    PrismaModule,
    SpecialtiesModule,
    ServicesModule,
    UtilitiesModule,
    HealthModule,
    MessageQueueModule,
  ],
})
export class AppModule {}