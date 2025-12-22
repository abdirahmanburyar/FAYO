import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Delete,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface RegisterTokenDto {
  token: string;
  deviceId?: string;
  platform?: 'android' | 'ios' | 'web';
}

interface SendNotificationDto {
  userId?: string;
  fcmToken?: string;
  fcmTokens?: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Register FCM token for current user
   */
  @Post('register-token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async registerToken(
    @CurrentUser() user: any,
    @Body() dto: RegisterTokenDto,
  ) {
    const userId = user.id || user.userId;
    this.logger.log(`📱 POST /notifications/register-token - User: ${userId}, Platform: ${dto.platform || 'unknown'}`);
    const result = await this.notificationsService.registerToken(
      userId,
      dto.token,
      dto.deviceId,
      dto.platform,
    );
    this.logger.log(`✅ Token registration completed for user ${userId}`);
    return result;
  }

  /**
   * Unregister FCM token
   */
  @Delete('unregister-token/:token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async unregisterToken(@Param('token') token: string) {
    this.logger.log(`🗑️ DELETE /notifications/unregister-token - Token: ${token.substring(0, 20)}...`);
    const result = await this.notificationsService.unregisterToken(token);
    this.logger.log(`✅ Token unregistration completed`);
    return result;
  }

  /**
   * Send test notification to current user
   */
  @Post('test')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async sendTestNotification(@CurrentUser() user: any) {
    const userId = user.id || user.userId;
    this.logger.log(`🧪 POST /notifications/test - Sending test notification to user ${userId}`);
    const result = await this.notificationsService.sendToUser({
      userId,
      payload: {
        title: 'Test Notification',
        body: 'This is a test notification from FAYO Healthcare',
        data: {
          type: 'TEST',
        },
      },
    });
    this.logger.log(`✅ Test notification sent to user ${userId}`);
    return result;
  }

  /**
   * Send custom notification (admin only)
   */
  @Post('send')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async sendNotification(@Body() dto: SendNotificationDto) {
    this.logger.log(`📤 POST /notifications/send - Custom notification`);
    this.logger.log(`   Title: "${dto.title}"`);
    this.logger.log(`   Target: ${dto.userId ? `User ${dto.userId}` : dto.fcmTokens ? `${dto.fcmTokens.length} token(s)` : 'Single token'}`);
    const result = await this.notificationsService.sendToTokens({
      userId: dto.userId,
      fcmToken: dto.fcmToken,
      fcmTokens: dto.fcmTokens,
      payload: {
        title: dto.title,
        body: dto.body,
        data: dto.data,
        imageUrl: dto.imageUrl,
      },
    });
    this.logger.log(`✅ Custom notification sent`);
    return result;
  }

  /**
   * Get user's FCM tokens
   */
  @Get('tokens')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getUserTokens(@CurrentUser() user: any) {
    const userId = user.id || user.userId;
    this.logger.log(`🔍 GET /notifications/tokens - Fetching tokens for user ${userId}`);
    const tokens = await this.notificationsService.getUserTokens(userId);
    this.logger.log(`✅ Found ${tokens.length} token(s) for user ${userId}`);
    return { tokens };
  }
}

