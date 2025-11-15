import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { EmailModule } from '../common/email/email.module';

@Module({
  imports: [
    EmailModule,
    // RabbitMQ is now completely optional - handled in service
  ],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
