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
    // Connect asynchronously without blocking module initialization
    this.connect().catch((error) => {
      this.logger.warn('⚠️ RabbitMQ connection failed during module init, will retry:', error.message);
    });
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

  async publishPaymentEvent(exchange: string, routingKey: string, event: any) {
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
        service: 'payment-service',
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

  // Payment-specific event publishers
  async publishPaymentInitiated(payment: any) {
    await this.publishPaymentEvent('payments', 'payment.waafipay.initiated', {
      type: 'payment.waafipay.initiated',
      payment,
      paymentId: payment.id,
      appointmentId: payment.appointmentId,
    });
  }

  async publishPaymentCompleted(payment: any) {
    await this.publishPaymentEvent('payments', 'payment.waafipay.completed', {
      type: 'payment.waafipay.completed',
      payment,
      paymentId: payment.id,
      appointmentId: payment.appointmentId,
    });
  }

  async publishPaymentFailed(payment: any, error?: string) {
    await this.publishPaymentEvent('payments', 'payment.waafipay.failed', {
      type: 'payment.waafipay.failed',
      payment,
      paymentId: payment.id,
      appointmentId: payment.appointmentId,
      error,
    });
  }
}

