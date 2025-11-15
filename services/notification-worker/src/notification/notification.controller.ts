import { Controller, Post, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendSmsDto, SendEmailDto, SendPushDto } from './dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('sms')
  sendSms(@Body() sendSmsDto: SendSmsDto) {
    return this.notificationService.sendSms(sendSmsDto);
  }

  @Post('email')
  sendEmail(@Body() sendEmailDto: SendEmailDto) {
    return this.notificationService.sendEmail(sendEmailDto);
  }

  @Post('push')
  sendPush(@Body() sendPushDto: SendPushDto) {
    return this.notificationService.sendPushNotification(sendPushDto);
  }

  @Post('otp-sms')
  sendOtpSms(@Body() body: { phone: string; code: string }) {
    return this.notificationService.sendOtpSms(body.phone, body.code);
  }

  @Post('appointment-confirmation')
  sendAppointmentConfirmation(@Body() body: { phone: string; appointmentDetails: any }) {
    return this.notificationService.sendAppointmentConfirmation(body.phone, body.appointmentDetails);
  }

  @Post('appointment-reminder')
  sendAppointmentReminder(@Body() body: { phone: string; appointmentDetails: any }) {
    return this.notificationService.sendAppointmentReminder(body.phone, body.appointmentDetails);
  }
}
