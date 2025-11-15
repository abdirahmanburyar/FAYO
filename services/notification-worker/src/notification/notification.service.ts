import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { SendSmsDto, SendEmailDto, SendPushDto } from './dto';

@Injectable()
export class NotificationService {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async sendSms(sendSmsDto: SendSmsDto): Promise<void> {
    await this.rabbitMQService.publishMessage('sms_queue', {
      phone: sendSmsDto.phone,
      message: sendSmsDto.message,
      timestamp: new Date().toISOString(),
    });
  }

  async sendEmail(sendEmailDto: SendEmailDto): Promise<void> {
    await this.rabbitMQService.publishMessage('email_queue', {
      email: sendEmailDto.email,
      subject: sendEmailDto.subject,
      message: sendEmailDto.message,
      timestamp: new Date().toISOString(),
    });
  }

  async sendPushNotification(sendPushDto: SendPushDto): Promise<void> {
    await this.rabbitMQService.publishMessage('push_queue', {
      deviceToken: sendPushDto.deviceToken,
      title: sendPushDto.title,
      body: sendPushDto.body,
      data: sendPushDto.data,
      timestamp: new Date().toISOString(),
    });
  }

  async sendOtpSms(phone: string, code: string): Promise<void> {
    const message = `Your FAYO verification code is: ${code}. This code will expire in 5 minutes.`;
    await this.sendSms({ phone, message });
  }

  async sendAppointmentConfirmation(phone: string, appointmentDetails: any): Promise<void> {
    const message = `Your appointment is confirmed for ${appointmentDetails.scheduledAt} with Dr. ${appointmentDetails.doctorName}.`;
    await this.sendSms({ phone, message });
  }

  async sendAppointmentReminder(phone: string, appointmentDetails: any): Promise<void> {
    const message = `Reminder: You have an appointment tomorrow at ${appointmentDetails.scheduledAt} with Dr. ${appointmentDetails.doctorName}.`;
    await this.sendSms({ phone, message });
  }
}
