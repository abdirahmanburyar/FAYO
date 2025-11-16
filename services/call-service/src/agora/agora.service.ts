import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RtcRole, RtcTokenBuilder } from 'agora-access-token';

export type AgoraRole = (typeof RtcRole)[keyof typeof RtcRole];

@Injectable()
export class AgoraService {
  private readonly logger = new Logger(AgoraService.name);

  constructor(private readonly configService: ConfigService) {}

  private get appId(): string {
    const appId = this.configService.get<string>('AGORA_APP_ID');
    if (!appId) {
      throw new InternalServerErrorException('Agora App ID is not configured');
    }
    return appId;
  }

  private get appCertificate(): string {
    const cert = this.configService.get<string>('AGORA_APP_CERTIFICATE');
    if (!cert) {
      throw new InternalServerErrorException('Agora App certificate is not configured');
    }
    return cert;
  }

  get tokenTtl(): number {
    const ttl = Number(this.configService.get<string>('AGORA_TOKEN_TTL', '3600'));
    return Number.isFinite(ttl) && ttl > 0 ? ttl : 3600;
  }

  generateToken(channelName: string, userAccount: string, role: AgoraRole) {
    const privilegeExpireTs = Math.floor(Date.now() / 1000) + this.tokenTtl;
    this.logger.debug(
      `Generating Agora token for channel=${channelName}, user=${userAccount}, role=${RtcRole[role]}`,
    );

    const token = RtcTokenBuilder.buildTokenWithAccount(
      this.appId,
      this.appCertificate,
      channelName,
      userAccount,
      role,
      privilegeExpireTs,
    );

    return {
      appId: this.appId,
      token,
      expiresIn: this.tokenTtl,
      expiresAt: new Date(privilegeExpireTs * 1000),
    };
  }
}

