import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmqpConnection, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class RabbitmqService {
  private readonly logger = new Logger(RabbitmqService.name);
  private readonly exchange: string;

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly eventEmitter: EventEmitter2,
    configService: ConfigService,
  ) {
    this.exchange = configService.get<string>('RABBITMQ_CALLS_EXCHANGE', 'calls.commands');
  }

  async publishCommand(routingKey: string, payload: Record<string, any>) {
    try {
      await this.amqpConnection.publish(this.exchange, routingKey, {
        ...payload,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to publish RabbitMQ command "${routingKey}"`, error);
    }
  }

  @RabbitSubscribe({
    exchange: process.env.RABBITMQ_CALLS_EXCHANGE || 'calls.commands',
    routingKey: 'calls.commands.*',
    queue: 'call-service.commands',
  })
  async handleCommand(message: any = {}) {
    this.logger.debug(`Received RabbitMQ command ${message?.type}`);
    this.eventEmitter.emit('call.command', message);
  }
}

