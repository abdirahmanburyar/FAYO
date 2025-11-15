import { Module } from '@nestjs/common';
import { MessageQueueService } from './message-queue.service';
import { SharedServiceClient } from './shared-service.client';
import { MockSharedServiceHandler } from './mock-shared-service.handler';

@Module({
  providers: [MessageQueueService, SharedServiceClient, MockSharedServiceHandler],
  exports: [MessageQueueService, SharedServiceClient],
})
export class MessageQueueModule {}
