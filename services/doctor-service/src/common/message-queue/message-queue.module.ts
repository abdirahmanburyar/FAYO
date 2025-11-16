import { Module } from '@nestjs/common';
import { SharedServiceClient } from './shared-service.client';

@Module({
  providers: [SharedServiceClient],
  exports: [SharedServiceClient],
})
export class MessageQueueModule {}
