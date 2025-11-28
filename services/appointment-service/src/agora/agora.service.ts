import { Injectable, Logger } from '@nestjs/common';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

@Injectable()
export class AgoraService {
  private readonly logger = new Logger(AgoraService.name);
  
  // Agora credentials
  private readonly appId = process.env.AGORA_APP_ID || '';
  private readonly appCertificate = process.env.AGORA_APP_CERTIFICATE || '';
  
  // Token expiration time (default 1 hour = 3600 seconds)
  private readonly tokenTTL = parseInt(process.env.AGORA_TOKEN_TTL || '3600', 10);

  /**
   * Generate Agora RTC token for a user
   * @param channelName - Unique channel name (e.g., appointment-{id})
   * @param uid - User ID (0 for auto-generated, or specific user ID)
   * @param role - User role: 'publisher' (HOST) or 'subscriber' (AUDIENCE)
   * @returns RTC token and channel information
   */
  async generateRtcToken(
    channelName: string,
    uid: number | string = 0,
    role: 'publisher' | 'subscriber' = 'publisher',
  ): Promise<{
    token: string;
    channelName: string;
    uid: number | string;
    appId: string;
    expiresAt: string;
    expiresIn: number;
  }> {
    try {
      if (!this.appId || !this.appCertificate) {
        throw new Error('Agora App ID and App Certificate must be configured');
      }

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const expirationTimestamp = currentTimestamp + this.tokenTTL;

      // Determine RTC role
      const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

      // Generate token
      const token = RtcTokenBuilder.buildTokenWithUid(
        this.appId,
        this.appCertificate,
        channelName,
        typeof uid === 'string' ? parseInt(uid) || 0 : uid,
        rtcRole,
        expirationTimestamp,
      );

      this.logger.log(
        `✅ Generated Agora RTC token for channel: ${channelName}, uid: ${uid}, role: ${role}`,
      );

      return {
        token,
        channelName,
        uid,
        appId: this.appId,
        expiresAt: new Date(expirationTimestamp * 1000).toISOString(),
        expiresIn: this.tokenTTL,
      };
    } catch (error) {
      this.logger.error('❌ Failed to generate Agora RTC token:', error);
      throw new Error(`Failed to generate Agora token: ${error.message}`);
    }
  }

  /**
   * Generate credentials for both HOST (publisher) and PARTICIPANT (subscriber)
   * @param channelName - Unique channel name
   * @param hostUid - Host user ID
   * @param participantUid - Participant user ID
   * @returns Credentials for both roles
   */
  async generateCallCredentials(
    channelName: string,
    hostUid: number | string = 0,
    participantUid: number | string = 0,
  ): Promise<{
    host: {
      token: string;
      channelName: string;
      uid: number | string;
      appId: string;
      expiresAt: string;
      expiresIn: number;
    };
    participant: {
      token: string;
      channelName: string;
      uid: number | string;
      appId: string;
      expiresAt: string;
      expiresIn: number;
    };
  }> {
    const [hostToken, participantToken] = await Promise.all([
      this.generateRtcToken(channelName, hostUid, 'publisher'), // HOST can publish
      this.generateRtcToken(channelName, participantUid, 'subscriber'), // PARTICIPANT can subscribe
    ]);

    return {
      host: hostToken,
      participant: participantToken,
    };
  }

  /**
   * Validate channel name format
   * @param channelName - Channel name to validate
   * @returns true if valid
   */
  validateChannelName(channelName: string): boolean {
    // Agora channel names can be up to 64 characters
    // Alphanumeric, hyphens, underscores allowed
    if (!channelName || channelName.length === 0 || channelName.length > 64) {
      return false;
    }
    // Check for valid characters
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    return validPattern.test(channelName);
  }

  /**
   * Get App ID
   * @returns App ID
   */
  getAppId(): string {
    return this.appId;
  }
}

