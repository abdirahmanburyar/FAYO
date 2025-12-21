import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AdsGateway } from './ads.gateway';

/**
 * Unified WebSocket Module for Monolithic API
 * 
 * This module contains all WebSocket gateways:
 * - AdsGateway (for ads updates)
 * - AppointmentGateway (for appointment updates) - imported via AppointmentsModule
 * - Other gateways as needed
 */
@Global()
@Module({
  imports: [EventEmitterModule],
  providers: [
    AdsGateway,
  ],
  exports: [
    AdsGateway,
  ],
})
export class WebsocketModule {}

