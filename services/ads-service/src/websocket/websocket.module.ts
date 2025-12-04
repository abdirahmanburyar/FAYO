import { Module } from '@nestjs/common';
import { AdsGateway } from './ads.gateway';

@Module({
  providers: [AdsGateway],
  exports: [AdsGateway],
})
export class WebsocketModule {}

