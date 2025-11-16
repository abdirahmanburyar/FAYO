import { Module } from '@nestjs/common';
import { CallGateway } from './call.gateway';
import { CallsModule } from '../calls/calls.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, CallsModule],
  providers: [CallGateway],
})
export class GatewayModule {}

