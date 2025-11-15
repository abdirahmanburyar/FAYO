import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendSms(phone: string, message: string): Promise<boolean> {
    try {
      // In production, integrate with SMS provider like Twilio, AWS SNS, etc.
      this.logger.log(`📱 Sending SMS to ${phone}: ${message}`);
      
      // Simulate SMS sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.logger.log(`✅ SMS sent successfully to ${phone}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send SMS to ${phone}:`, error.message);
      return false;
    }
  }

  async sendOtp(phone: string, code: string): Promise<boolean> {
    const message = `Your FAYO verification code is: ${code}. Valid for 5 minutes.`;
    return this.sendSms(phone, message);
  }
}
