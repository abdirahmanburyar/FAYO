import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from './hospitals.service';
import { DatabaseModule } from '../common/database/database.module';
import { SpecialtyServiceModule } from '../common/specialty-service/specialty-service.module';
import { RawWebSocketGateway } from '../websocket/raw-websocket.gateway';
import { KafkaService } from '../kafka/kafka.service';
import { MessageQueueModule } from '../common/message-queue/message-queue.module';

@Module({
  imports: [DatabaseModule, SpecialtyServiceModule, MessageQueueModule, HttpModule],
  controllers: [HospitalsController],
  providers: [HospitalsService, RawWebSocketGateway, KafkaService],
  exports: [HospitalsService, RawWebSocketGateway, KafkaService],
})
export class HospitalsModule {}
