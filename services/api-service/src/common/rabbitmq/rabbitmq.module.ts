import { Global, Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

/**
 * Unified RabbitMQ Module for Monolithic API
 * 
 * This module provides RabbitMQ messaging capabilities for all services.
 * It handles:
 * - Connection management with auto-reconnect
 * - Event publishing (appointments, payments, etc.)
 * - Queue subscriptions
 * - Error handling and resilience
 */
@Global()
@Module({
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}

