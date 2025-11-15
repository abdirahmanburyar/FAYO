import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private channel: any;

  constructor(
    @Inject('RABBITMQ_CONNECTION') private readonly connection: any,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.channel = await this.connection.createChannel();
    
    // Declare queues
    await this.channel.assertQueue('sms_queue', { durable: true });
    await this.channel.assertQueue('email_queue', { durable: true });
    await this.channel.assertQueue('push_queue', { durable: true });
    
    // Start consuming messages
    await this.startConsuming();
  }

  async onModuleDestroy() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }

  private async startConsuming() {
    // Consume SMS queue
    await this.channel.consume('sms_queue', async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await this.processSmsMessage(content);
          this.channel.ack(msg);
        } catch (error) {
          console.error('Error processing SMS message:', error);
          this.channel.nack(msg, false, false);
        }
      }
    });

    // Consume Email queue
    await this.channel.consume('email_queue', async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await this.processEmailMessage(content);
          this.channel.ack(msg);
        } catch (error) {
          console.error('Error processing Email message:', error);
          this.channel.nack(msg, false, false);
        }
      }
    });

    // Consume Push queue
    await this.channel.consume('push_queue', async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await this.processPushMessage(content);
          this.channel.ack(msg);
        } catch (error) {
          console.error('Error processing Push message:', error);
          this.channel.nack(msg, false, false);
        }
      }
    });

    console.log('✅ RabbitMQ consumers started');
  }

  private async processSmsMessage(content: any) {
    console.log('📱 Processing SMS:', content);
    
    // Simulate SMS sending
    await this.sendSms(content.phone, content.message);
    
    console.log(`✅ SMS sent to ${content.phone}`);
  }

  private async processEmailMessage(content: any) {
    console.log('📧 Processing Email:', content);
    
    // Simulate email sending
    await this.sendEmail(content.email, content.subject, content.message);
    
    console.log(`✅ Email sent to ${content.email}`);
  }

  private async processPushMessage(content: any) {
    console.log('🔔 Processing Push notification:', content);
    
    // Simulate push notification
    await this.sendPushNotification(content.deviceToken, content.title, content.body);
    
    console.log(`✅ Push notification sent to ${content.deviceToken}`);
  }

  private async sendSms(phone: string, message: string): Promise<void> {
    // In a real implementation, integrate with SMS provider like Twilio, AWS SNS, etc.
    console.log(`📱 SMS to ${phone}: ${message}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async sendEmail(email: string, subject: string, message: string): Promise<void> {
    // In a real implementation, integrate with email provider like SendGrid, AWS SES, etc.
    console.log(`📧 Email to ${email}: ${subject} - ${message}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async sendPushNotification(deviceToken: string, title: string, body: string): Promise<void> {
    // In a real implementation, integrate with FCM, APNS, etc.
    console.log(`🔔 Push to ${deviceToken}: ${title} - ${body}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  async publishMessage(queue: string, message: any): Promise<void> {
    await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
  }
}
