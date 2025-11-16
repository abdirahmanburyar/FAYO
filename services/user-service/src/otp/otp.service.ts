import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../common/redis/redis.service';
import { PrismaService } from '../common/database/prisma.service';
import { EmailService } from '../common/email/email.service';
import { v4 as uuidv4 } from 'uuid';
import * as amqp from 'amqplib';

@Injectable()
export class OtpService {
  private connection: any = null;
  private channel: any = null;

  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async generateOtp(phone: string): Promise<{ code: string; expiresIn: number; userCreated: boolean }> {
    try {
      // Check if user exists, if not create them
      let user = await this.prisma.user.findUnique({
        where: { phone, isActive: true },
      });

      let userCreated = false;
      if (!user) {
        // Create user with minimal data
        user = await this.prisma.user.create({
          data: {
            phone,
            firstName: 'User',
            lastName: 'User',
            role: 'PATIENT',
          },
        });
        userCreated = true;
      }

      const code = this.generateRandomCode();
      const expiresIn = parseInt(this.configService.get('OTP_EXPIRES_IN', '300000')); // 5 minutes default
      
      // Store in Redis for fast access (non-blocking)
      try {
        const redisKey = `otp:${phone}`;
        await this.redisService.setWithExpiry(redisKey, code, expiresIn / 1000);
      } catch (redisError) {
        console.warn('Redis error (non-critical):', redisError);
        // Continue even if Redis fails
      }
      
      // Store in database for audit trail
      try {
        await this.prisma.otpCode.create({
          data: {
            phone,
            code,
            expiresAt: new Date(Date.now() + expiresIn),
          },
        });
      } catch (dbError) {
        console.error('Database error storing OTP:', dbError);
        // Continue even if database write fails (OTP is still in Redis)
      }

      // Send OTP via email (non-blocking)
      await this.sendOtpViaEmail(phone, code).catch((emailError) => {
        console.warn('Email error (non-critical):', emailError);
      });

      return { code, expiresIn, userCreated };
    } catch (error) {
      console.error('Error in generateOtp:', error);
      throw error;
    }
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const redisKey = `otp:${phone}`;
    const storedCode = await this.redisService.get(redisKey);
    
    if (!storedCode || storedCode !== code) {
      return false;
    }

    // Mark as used in database
    await this.prisma.otpCode.updateMany({
      where: {
        phone,
        code,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // Remove from Redis
    await this.redisService.del(redisKey);
    
    return true;
  }

  private generateRandomCode(): string {
    const length = parseInt(this.configService.get('OTP_LENGTH', '6'));
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  async checkOtpExists(phone: string): Promise<boolean> {
    const redisKey = `otp:${phone}`;
    return await this.redisService.exists(redisKey);
  }

  private async sendOtpViaEmail(phone: string, code: string): Promise<void> {
    try {
      // Send OTP via email to the default email address
      const emailSent = await this.emailService.sendOtpEmail(phone, code);
      
      if (!emailSent) {
        // Fallback: log the OTP for manual delivery
        console.log(`📱 [OTP] Manual delivery required: ${code} for ${phone}`);
      }
    } catch (error) {
      // Fallback: log the OTP for manual delivery
      console.log(`📱 [OTP] Manual delivery required: ${code} for ${phone}`);
    }
  }

  private async publishSmsEvent(phone: string, code: string): Promise<void> {
    const rabbitmqUrl = this.configService.get('RABBITMQ_URL');
    
    if (!rabbitmqUrl) {
      return;
    }

    try {
      // Connect to RabbitMQ if not already connected
      if (!this.connection) {
        this.connection = await amqp.connect(rabbitmqUrl);
        this.channel = await this.connection.createChannel();
        
        // Declare exchange
        await this.channel.assertExchange('sms.exchange', 'topic', { durable: true });
      }

      // Publish SMS job to RabbitMQ
      const message = JSON.stringify({
        phone,
        message: `Your FAYO verification code is: ${code}. Valid for 5 minutes.`,
        type: 'otp',
        code,
      });

      this.channel!.publish('sms.exchange', 'sms.send', Buffer.from(message));
    } catch (error) {
      // Fallback: just log the OTP for development
      console.log(`📱 [OTP] Manual delivery required: ${code} for ${phone}`);
    }
  }
}
