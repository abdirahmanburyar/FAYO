import { Module } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { ZoomModule } from '../zoom/zoom.module';
import { KafkaModule } from '../messaging/kafka/kafka.module';
import { RabbitmqModule } from '../messaging/rabbitmq/rabbitmq.module';

@Module({
  imports: [ZoomModule, KafkaModule, RabbitmqModule],
  controllers: [CallsController],
  providers: [CallsService],
  exports: [CallsService],
})
export class CallsModule {}

