import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RabbitmqService } from './rabbitmq.service';

@Module({
  imports: [
    ConfigModule,
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('RABBITMQ_URI', 'amqp://guest:guest@rabbitmq:5672');
        return {
          uri,
        exchanges: [
          {
            name: configService.get<string>('RABBITMQ_CALLS_EXCHANGE', 'calls.commands'),
            type: 'topic',
          },
        ],
        connectionInitOptions: { wait: true, timeout: 30000 },
        };
      },
    }),
  ],
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}

