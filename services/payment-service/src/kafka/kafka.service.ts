import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'payment-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('✅ Connected to Kafka');
    } catch (error) {
      this.logger.error('❌ Failed to connect to Kafka:', error);
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      this.logger.log('Disconnected from Kafka');
    } catch (error) {
      this.logger.error('Error disconnecting from Kafka:', error);
    }
  }

  async publishPaymentEvent(topic: string, event: any) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: event.paymentId || event.id || 'unknown',
            value: JSON.stringify({
              ...event,
              timestamp: new Date().toISOString(),
              service: 'payment-service',
            }),
          },
        ],
      });
      this.logger.log(`📤 Published event to topic ${topic}:`, event);
    } catch (error) {
      this.logger.error(`❌ Failed to publish event to topic ${topic}:`, error);
    }
  }

  async publishPaymentCompleted(payment: any) {
    await this.publishPaymentEvent('payment.completed', {
      type: 'payment.completed',
      payment,
      paymentId: payment.id,
      appointmentId: payment.appointmentId,
    });
  }

  async publishPaymentFailed(payment: any) {
    await this.publishPaymentEvent('payment.failed', {
      type: 'payment.failed',
      payment,
      paymentId: payment.id,
      appointmentId: payment.appointmentId,
    });
  }
}

