import { Module } from '@nestjs/common';
import { SharedServiceClient } from './shared-service.client';
import { KafkaService } from '../../kafka/kafka.service';

@Module({
  providers: [SharedServiceClient, KafkaService],
  exports: [SharedServiceClient, KafkaService],
})
export class MessageQueueModule {}
