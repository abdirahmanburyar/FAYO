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
    const brokers = (configService.get<string>('KAFKA_BROKERS') || '').split(',').map((b) => b.trim());
    this.kafka = new Kafka({
      clientId: configService.get<string>('KAFKA_CLIENT_ID', 'call-service'),
      brokers,
    });
    this.topic = configService.get<string>('KAFKA_CALLS_TOPIC', 'calls.events');
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log('Kafka producer connected');
  }

  async publish(event: string, payload: Record<string, any>) {
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
      this.logger.error(`Failed to publish Kafka event "${event}"`, error);
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }
}

