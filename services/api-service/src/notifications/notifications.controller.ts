import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Delete,
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
    return this.notificationsService.registerToken(
      user.id || user.userId,
      dto.token,
      dto.deviceId,
      dto.platform,
    );
  }

  /**
   * Unregister FCM token
   */
  @Delete('unregister-token/:token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async unregisterToken(@Param('token') token: string) {
    return this.notificationsService.unregisterToken(token);
  }

  /**
   * Send test notification to current user
   */
  @Post('test')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async sendTestNotification(@CurrentUser() user: any) {
    return this.notificationsService.sendToUser({
      userId: user.id || user.userId,
      payload: {
        title: 'Test Notification',
        body: 'This is a test notification from FAYO Healthcare',
        data: {
          type: 'TEST',
        },
      },
    });
  }

  /**
   * Send custom notification (admin only)
   */
  @Post('send')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationsService.sendToTokens({
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
  }

  /**
   * Get user's FCM tokens
   */
  @Get('tokens')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async getUserTokens(@CurrentUser() user: any) {
    const tokens = await this.notificationsService.getUserTokens(
      user.id || user.userId,
    );
    return { tokens };
  }
}

