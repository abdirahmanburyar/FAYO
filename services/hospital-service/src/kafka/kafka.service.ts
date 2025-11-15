import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'hospital-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'hospital-service-group' });
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      await this.consumer.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Kafka:', error);
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
    } catch (error) {
      this.logger.error('Error disconnecting from Kafka:', error);
    }
  }

  async publishHospitalEvent(topic: string, event: any) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: event.hospitalId || event.id || 'unknown',
            value: JSON.stringify({
              ...event,
              timestamp: new Date().toISOString(),
              service: 'hospital-service',
            }),
          },
        ],
      });
      this.logger.log(`Published event to topic ${topic}:`, event);
    } catch (error) {
      this.logger.error(`Failed to publish event to topic ${topic}:`, error);
    }
  }

  async subscribeToTopic(topic: string, callback: (message: any) => void) {
    try {
      await this.consumer.subscribe({ topic, fromBeginning: false });
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
          try {
            const messageValue = message.value?.toString();
            if (messageValue) {
              const parsedMessage = JSON.parse(messageValue);
              this.logger.log(`Received message from topic ${topic}:`, parsedMessage);
              callback(parsedMessage);
            }
          } catch (error) {
            this.logger.error(`Error processing message from topic ${topic}:`, error);
          }
        },
      });
      
      this.logger.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic ${topic}:`, error);
    }
  }

  // Hospital-specific event publishers
  async publishHospitalCreated(hospital: any) {
    await this.publishHospitalEvent('hospital.created', {
      type: 'hospital.created',
      hospital,
      hospitalId: hospital.id,
    });
  }

  async publishHospitalUpdated(hospital: any) {
    await this.publishHospitalEvent('hospital.updated', {
      type: 'hospital.updated',
      hospital,
      hospitalId: hospital.id,
    });
  }

  async publishHospitalDeleted(hospitalId: string) {
    await this.publishHospitalEvent('hospital.deleted', {
      type: 'hospital.deleted',
      hospitalId,
    });
  }

  async publishHospitalStatusChanged(hospital: any) {
    await this.publishHospitalEvent('hospital.status_changed', {
      type: 'hospital.status_changed',
      hospital,
      hospitalId: hospital.id,
    });
  }
}
