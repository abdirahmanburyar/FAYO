import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './common/database/database.module';
import { KafkaModule } from './common/kafka/kafka.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { TriageModule } from './triage/triage.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    KafkaModule,
    AppointmentsModule,
    TriageModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
