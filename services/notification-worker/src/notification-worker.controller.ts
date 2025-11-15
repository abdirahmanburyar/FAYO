import { Controller, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { SmsService } from './sms/sms.service';

@Controller()
export class NotificationWorkerController {
  private readonly logger = new Logger(NotificationWorkerController.name);

  constructor(private readonly smsService: SmsService) {}

  @RabbitSubscribe({
    exchange: 'sms.exchange',
    routingKey: 'sms.send',
    queue: 'sms.queue',
  })
  async handleSmsMessage(message: {
    phone: string;
    message: string;
    type: string;
    code?: string;
  }) {
    this.logger.log(`📨 Received SMS message for ${message.phone}`);
    
    try {
      if (message.type === 'otp' && message.code) {
        await this.smsService.sendOtp(message.phone, message.code);
      } else {
        await this.smsService.sendSms(message.phone, message.message);
      }
      
      this.logger.log(`✅ SMS message processed successfully for ${message.phone}`);
    } catch (error) {
      this.logger.error(`❌ Failed to process SMS message for ${message.phone}:`, error.message);
    }
  }
}
