import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KafkaService {
  private producer: any;

  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafka: any,
    private readonly configService: ConfigService,
  ) {
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async publishEvent(topic: string, message: any) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: message.id || 'default',
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
          },
        ],
      });
      console.log(`Event published to topic ${topic}:`, message);
    } catch (error) {
      console.error('Error publishing event:', error);
      throw error;
    }
  }

  async publishAppointmentCreated(appointment: any) {
    await this.publishEvent('appointment.created', {
      id: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      specialty: appointment.specialty,
      scheduledAt: appointment.scheduledAt,
      status: appointment.status,
      createdAt: appointment.createdAt,
    });
  }

  async publishAppointmentUpdated(appointment: any) {
    await this.publishEvent('appointment.updated', {
      id: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      specialty: appointment.specialty,
      scheduledAt: appointment.scheduledAt,
      status: appointment.status,
      updatedAt: appointment.updatedAt,
    });
  }

  async publishTriageRequested(triage: any) {
    await this.publishEvent('triage.requested', {
      id: triage.id,
      patientId: triage.patientId,
      symptoms: triage.symptoms,
      urgency: triage.urgency,
      createdAt: triage.createdAt,
    });
  }
}
