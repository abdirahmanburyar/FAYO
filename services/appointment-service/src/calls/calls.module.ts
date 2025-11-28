import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { DatabaseModule } from '../common/database/database.module';
import { AgoraModule } from '../agora/agora.module';
import { KafkaModule } from '../kafka/kafka.module';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [DatabaseModule, AgoraModule, KafkaModule, RabbitMQModule, WebsocketModule],
  controllers: [CallsController],
  providers: [CallsService],
  exports: [CallsService],
})
export class CallsModule {}

