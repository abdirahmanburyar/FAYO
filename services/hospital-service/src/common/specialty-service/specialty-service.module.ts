import { Module } from '@nestjs/common';
import { SpecialtyServiceClient } from './specialty-service.client';

@Module({
  providers: [SpecialtyServiceClient],
  exports: [SpecialtyServiceClient],
})
export class SpecialtyServiceModule {}

