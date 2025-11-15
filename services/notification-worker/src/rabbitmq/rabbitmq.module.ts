import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'RABBITMQ_CONNECTION',
      useFactory: async (configService: ConfigService) => {
        const amqp = require('amqplib');
        const connection = await amqp.connect(configService.get('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672'));
        return connection;
      },
      inject: [ConfigService],
    },
    RabbitMQService,
  ],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
