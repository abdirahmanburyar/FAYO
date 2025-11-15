import { Module } from '@nestjs/common';
import { MessageQueueService } from './message-queue.service';
import { SharedServiceHandler } from './shared-service.handler';
import { SpecialtiesModule } from '../../specialties/specialties.module';
import { ServicesModule } from '../../services/services.module';

@Module({
  imports: [SpecialtiesModule, ServicesModule],
  providers: [MessageQueueService, SharedServiceHandler],
  exports: [MessageQueueService],
})
export class MessageQueueModule {}
