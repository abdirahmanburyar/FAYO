import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { AppointmentGateway } from '../websocket/appointment.gateway';

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaConsumerService.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly appointmentGateway: AppointmentGateway,
  ) {}

  async onModuleInit() {
    // Wait a bit for topics to be created
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Register all subscriptions first (before consumer starts)
    // Subscribe to appointment events and forward them via WebSocket
    await this.kafkaService.subscribeToTopic('appointment.created', (message) => {
      this.logger.log('📥 Received appointment.created event from Kafka');
      this.appointmentGateway.broadcastAppointmentCreated(message.appointment);
    });

    await this.kafkaService.subscribeToTopic('appointment.updated', (message) => {
      this.logger.log('📥 Received appointment.updated event from Kafka');
      this.appointmentGateway.broadcastAppointmentUpdated(message.appointment);
    });

    await this.kafkaService.subscribeToTopic('appointment.cancelled', (message) => {
      this.logger.log('📥 Received appointment.cancelled event from Kafka');
      this.appointmentGateway.broadcastAppointmentCancelled(
        message.appointmentId,
        message,
      );
    });

    await this.kafkaService.subscribeToTopic('appointment.confirmed', (message) => {
      this.logger.log('📥 Received appointment.confirmed event from Kafka');
      this.appointmentGateway.broadcastAppointmentConfirmed(
        message.appointmentId,
        message.appointment,
      );
    });

    this.logger.log('✅ Kafka consumer service initialized');
  }
}

