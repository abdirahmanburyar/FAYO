import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer, EachMessagePayload, Admin } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private isConsumerRunning = false;
  private topicCallbacks = new Map<string, (message: any) => void>();

  constructor() {
    this.kafka = new Kafka({
      clientId: 'appointment-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'appointment-service-group' });
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      this.logger.log('✅ Connected to Kafka');
      
      // Wait a bit for Kafka to be fully ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create topics if they don't exist
      await this.createTopicsIfNotExist();
    } catch (error) {
      this.logger.error('❌ Failed to connect to Kafka:', error);
    }
  }

  private async createTopicsIfNotExist() {
    try {
      const admin = this.kafka.admin();
      await admin.connect();
      
              const topics = [
                'appointment.created',
                'appointment.updated',
                'appointment.cancelled',
                'appointment.confirmed',
                'call.created',
                'call.ended',
              ];
      
      const existingTopics = await admin.listTopics();
      const topicsToCreate = topics.filter(topic => !existingTopics.includes(topic));
      
      if (topicsToCreate.length > 0) {
        await admin.createTopics({
          topics: topicsToCreate.map(topic => ({
            topic,
            numPartitions: 1,
            replicationFactor: 1,
          })),
        });
        this.logger.log(`✅ Created Kafka topics: ${topicsToCreate.join(', ')}`);
      } else {
        this.logger.log('✅ All Kafka topics already exist');
      }
      
      await admin.disconnect();
    } catch (error) {
      this.logger.error('❌ Error creating Kafka topics:', error);
      // Don't throw - topics might be created manually or auto-creation might be enabled
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      this.logger.log('Disconnected from Kafka');
    } catch (error) {
      this.logger.error('Error disconnecting from Kafka:', error);
    }
  }

  async publishAppointmentEvent(topic: string, event: any) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: event.appointmentId || event.id || 'unknown',
            value: JSON.stringify({
              ...event,
              timestamp: new Date().toISOString(),
              service: 'appointment-service',
            }),
          },
        ],
      });
      this.logger.log(`📤 Published event to topic ${topic}:`, event);
    } catch (error) {
      this.logger.error(`❌ Failed to publish event to topic ${topic}:`, error);
    }
  }

  async subscribeToTopic(topic: string, callback: (message: any) => void) {
    try {
      // Ensure topic exists before subscribing
      await this.ensureTopicExists(topic);
      
      // Store the callback for this topic
      this.topicCallbacks.set(topic, callback);
      
      // If consumer is not running, subscribe and start it
      if (!this.isConsumerRunning) {
        // Wait a moment for topic to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Subscribe to all topics that have callbacks
        const topicsToSubscribe = Array.from(this.topicCallbacks.keys());
        await this.consumer.subscribe({ 
          topics: topicsToSubscribe,
          fromBeginning: false 
        });
        
        // Start the consumer once for all topics
        await this.consumer.run({
          eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
            try {
              const messageValue = message.value?.toString();
              if (messageValue) {
                const parsedMessage = JSON.parse(messageValue);
                this.logger.log(`📥 Received message from topic ${topic}:`, parsedMessage);
                
                // Get the callback for this topic
                const callback = this.topicCallbacks.get(topic);
                if (callback) {
                  callback(parsedMessage);
                } else {
                  this.logger.warn(`⚠️ No callback registered for topic: ${topic}`);
                }
              }
            } catch (error) {
              this.logger.error(`❌ Error processing message from topic ${topic}:`, error);
            }
          },
        });
        
        this.isConsumerRunning = true;
        this.logger.log(`✅ Consumer started and subscribed to topics: ${topicsToSubscribe.join(', ')}`);
      } else {
        // Consumer is already running, we can't add more subscriptions
        // This topic will be handled if we restart the consumer
        this.logger.warn(`⚠️ Consumer is already running. Topic ${topic} callback registered but subscription will require restart.`);
      }
      
      this.logger.log(`✅ Registered callback for topic: ${topic}`);
    } catch (error) {
      this.logger.error(`❌ Failed to subscribe to topic ${topic}:`, error);
    }
  }

  private async ensureTopicExists(topic: string) {
    let admin: Admin | null = null;
    try {
      admin = this.kafka.admin();
      await admin.connect();
      
      const existingTopics = await admin.listTopics();
      this.logger.log(`📋 Existing Kafka topics: ${existingTopics.join(', ') || 'none'}`);
      
      if (!existingTopics.includes(topic)) {
        this.logger.log(`📝 Creating Kafka topic: ${topic}`);
        await admin.createTopics({
          waitForLeaders: true,
          timeout: 10000,
          topics: [{
            topic,
            numPartitions: 1,
            replicationFactor: 1,
          }],
        });
        this.logger.log(`✅ Created Kafka topic: ${topic}`);
        
        // Wait a bit for topic to be fully ready
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        this.logger.log(`✅ Kafka topic already exists: ${topic}`);
      }
    } catch (error: any) {
      // Topic might be created by auto-creation, so we log but don't fail
      this.logger.warn(`⚠️ Topic ${topic} creation check (may be auto-created): ${error?.message || error}`);
    } finally {
      if (admin) {
        try {
          await admin.disconnect();
        } catch (error) {
          // Ignore disconnect errors
        }
      }
    }
  }

  // Appointment-specific event publishers
  async publishAppointmentCreated(appointment: any) {
    await this.publishAppointmentEvent('appointment.created', {
      type: 'appointment.created',
      appointment,
      appointmentId: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
    });
  }

  async publishAppointmentUpdated(appointment: any) {
    await this.publishAppointmentEvent('appointment.updated', {
      type: 'appointment.updated',
      appointment,
      appointmentId: appointment.id,
    });
  }

  async publishAppointmentCancelled(appointmentId: string, data: any) {
    await this.publishAppointmentEvent('appointment.cancelled', {
      type: 'appointment.cancelled',
      appointmentId,
      ...data,
    });
  }

  async publishAppointmentConfirmed(appointmentId: string, appointment: any) {
    await this.publishAppointmentEvent('appointment.confirmed', {
      type: 'appointment.confirmed',
      appointmentId,
      appointment,
    });
  }

  // Call-specific event publishers
  async publishCallCreated(event: any) {
    await this.publishAppointmentEvent('call.created', {
      type: 'call.created',
      ...event,
    });
  }

  async publishCallEnded(event: any) {
    await this.publishAppointmentEvent('call.ended', {
      type: 'call.ended',
      ...event,
    });
  }
}

