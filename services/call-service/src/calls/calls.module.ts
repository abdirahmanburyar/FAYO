import { Module } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { AgoraModule } from '../agora/agora.module';
import { KafkaModule } from '../messaging/kafka/kafka.module';
import { RabbitmqModule } from '../messaging/rabbitmq/rabbitmq.module';

@Module({
  imports: [AgoraModule, KafkaModule, RabbitmqModule],
  controllers: [CallsController],
  providers: [CallsService],
  exports: [CallsService],
})
export class CallsModule {}

