import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

  async onModuleInit() {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      this.logger.log('✅ Connected to RabbitMQ');
    } catch (error) {
      this.logger.error('❌ Failed to connect to RabbitMQ:', error);
    }
  }

  async onModuleDestroy() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  async publishAppointmentEvent(exchange: string, routingKey: string, event: any) {
    try {
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      
      const message = JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
        service: 'appointment-service',
      });

      this.channel.publish(exchange, routingKey, Buffer.from(message), {
        persistent: true,
      });

      this.logger.log(`📤 Published event to ${exchange}/${routingKey}:`, event);
    } catch (error) {
      this.logger.error(`❌ Failed to publish event to ${exchange}/${routingKey}:`, error);
    }
  }

  async subscribeToQueue(
    queue: string,
    exchange: string,
    routingKey: string,
    callback: (message: any) => void,
  ) {
    try {
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.bindQueue(queue, exchange, routingKey);

      await this.channel.consume(queue, (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            this.logger.log(`📥 Received message from queue ${queue}:`, content);
            callback(content);
            this.channel.ack(msg);
          } catch (error) {
            this.logger.error(`❌ Error processing message from queue ${queue}:`, error);
            this.channel.nack(msg, false, false);
          }
        }
      });

      this.logger.log(`✅ Subscribed to queue: ${queue} (${exchange}/${routingKey})`);
    } catch (error) {
      this.logger.error(`❌ Failed to subscribe to queue ${queue}:`, error);
    }
  }

  // Appointment-specific event publishers
  async publishAppointmentCreated(appointment: any) {
    await this.publishAppointmentEvent(
      'appointments',
      'appointment.created',
      {
        type: 'appointment.created',
        appointment,
        appointmentId: appointment.id,
        appointmentNumber: appointment.appointmentNumber,
      },
    );
  }

  async publishAppointmentUpdated(appointment: any) {
    await this.publishAppointmentEvent('appointments', 'appointment.updated', {
      type: 'appointment.updated',
      appointment,
      appointmentId: appointment.id,
    });
  }

  // Call-specific event publishers
  async publishCallCreated(event: any) {
    await this.publishAppointmentEvent('calls', 'call.created', {
      type: 'call.created',
      ...event,
    });
  }

  async publishCallEnded(event: any) {
    await this.publishAppointmentEvent('calls', 'call.ended', {
      type: 'call.ended',
      ...event,
    });
  }
}

