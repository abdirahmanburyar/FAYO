import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  private isConnecting = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly reconnectDelay = 5000; // 5 seconds
  private isShuttingDown = false;

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  private async connect() {
    if (this.isConnecting || this.isShuttingDown) {
      return;
    }

    this.isConnecting = true;
    try {
      this.logger.log(`Attempting to connect to RabbitMQ at ${this.url.replace(/:[^:@]+@/, ':****@')}`);
      
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      
      // Set up error handlers
      this.connection.on('error', (err) => {
        if (err) {
          this.logger.error('❌ RabbitMQ connection error:', err.message);
          this.handleConnectionError();
        }
      });

      this.connection.on('close', () => {
        this.logger.warn('⚠️ RabbitMQ connection closed');
        if (!this.isShuttingDown) {
          this.handleConnectionError();
        }
      });

      this.channel.on('error', (err) => {
        if (err) {
          this.logger.error('❌ RabbitMQ channel error:', err.message);
          this.handleChannelError();
        }
      });

      this.channel.on('close', () => {
        this.logger.warn('⚠️ RabbitMQ channel closed');
        if (!this.isShuttingDown && this.connection) {
          this.handleChannelError();
        }
      });

      this.logger.log('✅ Connected to RabbitMQ');
      this.isConnecting = false;
    } catch (error) {
      this.isConnecting = false;
      this.logger.error('❌ Failed to connect to RabbitMQ:', error instanceof Error ? error.message : String(error));
      this.logger.warn('⚠️ RabbitMQ is unavailable. Service will continue without RabbitMQ messaging.');
      this.logger.warn('⚠️ WebSocket will be used as primary messaging mechanism.');
      
      // Schedule reconnection attempt
      if (!this.isShuttingDown) {
        this.scheduleReconnect();
      }
    }
  }

  private handleConnectionError() {
    if (this.isShuttingDown) {
      return;
    }

    this.logger.warn('⚠️ Handling RabbitMQ connection error, will attempt to reconnect...');
    this.connection = null;
    this.channel = null;
    this.scheduleReconnect();
  }

  private handleChannelError() {
    if (this.isShuttingDown || !this.connection) {
      return;
    }

    this.logger.warn('⚠️ Handling RabbitMQ channel error, will attempt to recreate channel...');
    this.channel = null;
    
    // Try to recreate channel
    this.connection.createChannel()
      .then((newChannel) => {
        this.channel = newChannel;
        this.logger.log('✅ RabbitMQ channel recreated');
        
        // Re-setup channel error handlers
        this.channel.on('error', (err) => {
          if (err) {
            this.logger.error('❌ RabbitMQ channel error:', err.message);
            this.handleChannelError();
          }
        });

        this.channel.on('close', () => {
          this.logger.warn('⚠️ RabbitMQ channel closed');
          if (!this.isShuttingDown && this.connection) {
            this.handleChannelError();
          }
        });
      })
      .catch((error) => {
        this.logger.error('❌ Failed to recreate RabbitMQ channel:', error.message);
        this.handleConnectionError();
      });
  }

  private scheduleReconnect() {
    if (this.isShuttingDown || this.reconnectTimeout) {
      return;
    }

    this.logger.log(`⏳ Scheduling RabbitMQ reconnection in ${this.reconnectDelay}ms...`);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, this.reconnectDelay);
  }

  private async ensureConnection(): Promise<boolean> {
    if (this.connection && this.channel) {
      return true;
    }

    if (!this.isConnecting) {
      await this.connect();
    }

    // Wait a bit for connection to establish
    let attempts = 0;
    while (attempts < 10 && (!this.connection || !this.channel)) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    return !!(this.connection && this.channel);
  }

  async publishAppointmentEvent(exchange: string, routingKey: string, event: any) {
    try {
      const isConnected = await this.ensureConnection();
      if (!isConnected) {
        this.logger.warn(`⚠️ RabbitMQ not available, skipping publish to ${exchange}/${routingKey}`);
        return;
      }

      await this.channel!.assertExchange(exchange, 'topic', { durable: true });
      
      const message = JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
        service: 'appointment-service',
      });

      this.channel!.publish(exchange, routingKey, Buffer.from(message), {
        persistent: true,
      });

      this.logger.log(`📤 Published event to ${exchange}/${routingKey}:`, event);
    } catch (error) {
      this.logger.error(`❌ Failed to publish event to ${exchange}/${routingKey}:`, error instanceof Error ? error.message : String(error));
      // Don't throw - RabbitMQ is optional, service should continue
    }
  }

  async subscribeToQueue(
    queue: string,
    exchange: string,
    routingKey: string,
    callback: (message: any) => void,
  ) {
    try {
      const isConnected = await this.ensureConnection();
      if (!isConnected) {
        this.logger.warn(`⚠️ RabbitMQ not available, cannot subscribe to queue ${queue}`);
        return;
      }

      await this.channel!.assertExchange(exchange, 'topic', { durable: true });
      await this.channel!.assertQueue(queue, { durable: true });
      await this.channel!.bindQueue(queue, exchange, routingKey);

      await this.channel!.consume(queue, (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            this.logger.log(`📥 Received message from queue ${queue}:`, content);
            callback(content);
            this.channel!.ack(msg);
          } catch (error) {
            this.logger.error(`❌ Error processing message from queue ${queue}:`, error instanceof Error ? error.message : String(error));
            this.channel!.nack(msg, false, false);
          }
        }
      });

      this.logger.log(`✅ Subscribed to queue: ${queue} (${exchange}/${routingKey})`);
    } catch (error) {
      this.logger.error(`❌ Failed to subscribe to queue ${queue}:`, error instanceof Error ? error.message : String(error));
      // Don't throw - RabbitMQ is optional
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

