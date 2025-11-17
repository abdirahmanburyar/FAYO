import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export enum ZoomRole {
  HOST = 1,
  PARTICIPANT = 0,
}

@Injectable()
export class ZoomService {
  private readonly logger = new Logger(ZoomService.name);

  constructor(private readonly configService: ConfigService) {}

  private get sdkKey(): string {
    const key = this.configService.get<string>('ZOOM_SDK_KEY');
    if (!key) {
      throw new InternalServerErrorException('Zoom SDK Key is not configured');
    }
    return key;
  }

  private get sdkSecret(): string {
    const secret = this.configService.get<string>('ZOOM_SDK_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('Zoom SDK Secret is not configured');
    }
    return secret;
  }

  get tokenTtl(): number {
    const ttl = Number(this.configService.get<string>('ZOOM_TOKEN_TTL', '3600'));
    return Number.isFinite(ttl) && ttl > 0 ? ttl : 3600;
  }

  /**
   * Generate Zoom Video SDK JWT token
   * @param sessionName - The session/meeting name
   * @param userIdentity - User identifier (email or unique ID)
   * @param role - User role (HOST or PARTICIPANT)
   * @returns JWT token and metadata
   */
  generateToken(sessionName: string, userIdentity: string, role: ZoomRole = ZoomRole.PARTICIPANT) {
    const expirationTime = Math.floor(Date.now() / 1000) + this.tokenTtl;
    
    this.logger.debug(
      `Generating Zoom token for session=${sessionName}, user=${userIdentity}, role=${role === ZoomRole.HOST ? 'HOST' : 'PARTICIPANT'}`,
    );

    // Zoom Video SDK JWT payload structure
    // Note: sessionName, userIdentity, and role are custom claims for Video SDK
    const payload = {
      iss: this.sdkKey,
      exp: expirationTime,
      aud: 'zoom',
      iat: Math.floor(Date.now() / 1000),
      sessionName: sessionName,
      userIdentity: userIdentity,
      role: role,
    };

    try {
      const token = jwt.sign(payload, this.sdkSecret, {
        algorithm: 'HS256',
      });

      return {
        sdkKey: this.sdkKey,
        token,
        sessionName,
        userIdentity,
        role: role === ZoomRole.HOST ? 'HOST' : 'PARTICIPANT',
        expiresIn: this.tokenTtl,
        expiresAt: new Date(expirationTime * 1000),
      };
    } catch (error) {
      this.logger.error(`Error generating Zoom token: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to generate Zoom token');
    }
  }
}

