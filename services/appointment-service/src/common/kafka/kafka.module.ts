import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'KAFKA_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const { Kafka } = require('kafkajs');
        return new Kafka({
          clientId: configService.get('KAFKA_CLIENT_ID', 'appointment-service'),
          brokers: [configService.get('KAFKA_BROKER', 'localhost:9092')],
        });
      },
      inject: [ConfigService],
    },
    KafkaService,
  ],
  exports: [KafkaService],
})
export class KafkaModule {}
