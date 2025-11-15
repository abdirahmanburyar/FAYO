import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { NotificationWorkerController } from './notification-worker.controller';
import { SmsModule } from './sms/sms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SmsModule,
    RabbitMQModule.forRoot({
      exchanges: [
        {
          name: 'sms.exchange',
          type: 'topic',
        },
      ],
      uri: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    }),
  ],
  controllers: [NotificationWorkerController],
})
export class AppModule {}