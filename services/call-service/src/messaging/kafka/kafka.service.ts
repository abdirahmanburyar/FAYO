import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private readonly topic: string;

  constructor(private readonly configService: ConfigService) {
    const brokers = (configService.get<string>('KAFKA_BROKERS') || '').split(',').map((b) => b.trim()).filter(Boolean);
    if (brokers.length === 0) {
      this.logger.warn('KAFKA_BROKERS not configured, Kafka functionality will be disabled');
    }
    this.kafka = new Kafka({
      clientId: configService.get<string>('KAFKA_CLIENT_ID', 'call-service'),
      brokers: brokers.length > 0 ? brokers : ['localhost:9092'], // Fallback to prevent errors
    });
    this.topic = configService.get<string>('KAFKA_CALLS_TOPIC', 'calls.events');
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    const brokers = (this.configService.get<string>('KAFKA_BROKERS') || '').split(',').map((b) => b.trim()).filter(Boolean);
    if (brokers.length === 0) {
      this.logger.warn('Kafka brokers not configured, skipping connection');
      return;
    }
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to connect Kafka producer: ${errorMessage}`, errorStack);
      // Don't throw - allow service to start even if Kafka is unavailable
    }
  }

  async publish(event: string, payload: Record<string, any>) {
    const brokers = (this.configService.get<string>('KAFKA_BROKERS') || '').split(',').map((b) => b.trim()).filter(Boolean);
    if (brokers.length === 0) {
      this.logger.debug(`Kafka not configured, skipping event "${event}"`);
      return;
    }
    try {
      await this.producer.send({
        topic: this.topic,
        messages: [
          {
            key: event,
            value: JSON.stringify({
              event,
              timestamp: new Date().toISOString(),
              payload,
            }),
          },
        ],
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to publish Kafka event "${event}": ${errorMessage}`, errorStack);
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error disconnecting Kafka producer: ${errorMessage}`, errorStack);
    }
  }
}

