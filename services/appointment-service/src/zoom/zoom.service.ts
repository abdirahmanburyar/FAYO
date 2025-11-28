import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class ZoomService {
  private readonly logger = new Logger(ZoomService.name);
  
  // Zoom OAuth credentials (Server-to-Server OAuth)
  private readonly accountId = process.env.ZOOM_ACCOUNT_ID || '_0KznqaLQ5eJyShNghCUoA';
  private readonly clientId = process.env.ZOOM_CLIENT_ID || '6R_pUUFwQly6EKFd2RBfg';
  private readonly clientSecret = process.env.ZOOM_CLIENT_SECRET || 'VxrQNSNj3OACF0q8Ap3gELyQ2i3NJ9Bo';
  private readonly secretToken = process.env.ZOOM_SECRET_TOKEN || '_PDXL7P9REejA-GIZO3Lgg';
  
  // Token expiration time (default 1 hour)
  private readonly tokenTTL = parseInt(process.env.ZOOM_TOKEN_TTL || '3600', 10);

  /**
   * Generate Zoom Video SDK JWT token for a user
   * @param sessionName - Unique session name (e.g., appointment-{id})
   * @param userIdentity - User identifier (e.g., admin-{id} or patient-{id})
   * @param role - User role: 1 for HOST, 0 for PARTICIPANT
   * @returns JWT token and session information
   */
  async generateVideoSDKToken(
    sessionName: string,
    userIdentity: string,
    role: 1 | 0 = 0, // 1 = HOST, 0 = PARTICIPANT
  ): Promise<{
    token: string;
    sessionName: string;
    userIdentity: string;
    role: number;
    expiresAt: string;
    expiresIn: number;
  }> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const expiration = now + this.tokenTTL;

      // Zoom Video SDK JWT payload format
      // Reference: https://marketplace.zoom.us/docs/guides/auth/jwt
      const payload = {
        iss: this.clientId, // Issuer (Client ID / SDK Key)
        exp: expiration, // Expiration time (Unix timestamp)
        iat: now, // Issued at (Unix timestamp)
        aud: 'zoom', // Audience
        appKey: this.clientId, // App Key (same as Client ID)
        tokenExp: expiration, // Token expiration
        alg: 'HS256', // Algorithm
      };

      // Sign the token with Client Secret (SDK Secret)
      const token = jwt.sign(payload, this.clientSecret, {
        algorithm: 'HS256',
      });

      this.logger.log(
        `✅ Generated Zoom Video SDK token for session: ${sessionName}, user: ${userIdentity}, role: ${role === 1 ? 'HOST' : 'PARTICIPANT'}`,
      );

      return {
        token,
        sessionName,
        userIdentity,
        role,
        expiresAt: new Date(expiration * 1000).toISOString(),
        expiresIn: this.tokenTTL,
      };
    } catch (error) {
      this.logger.error('❌ Failed to generate Zoom Video SDK token:', error);
      throw new Error('Failed to generate Zoom token');
    }
  }

  /**
   * Generate credentials for both HOST and PARTICIPANT
   * @param sessionName - Unique session name
   * @param hostIdentity - Host user identifier
   * @param participantIdentity - Participant user identifier
   * @returns Credentials for both roles
   */
  async generateCallCredentials(
    sessionName: string,
    hostIdentity: string,
    participantIdentity: string,
  ): Promise<{
    host: {
      token: string;
      sessionName: string;
      userIdentity: string;
      role: number;
      expiresAt: string;
      expiresIn: number;
    };
    participant: {
      token: string;
      sessionName: string;
      userIdentity: string;
      role: number;
      expiresAt: string;
      expiresIn: number;
    };
  }> {
    const [hostToken, participantToken] = await Promise.all([
      this.generateVideoSDKToken(sessionName, hostIdentity, 1), // HOST
      this.generateVideoSDKToken(sessionName, participantIdentity, 0), // PARTICIPANT
    ]);

    return {
      host: hostToken,
      participant: participantToken,
    };
  }

  /**
   * Validate session name format
   * @param sessionName - Session name to validate
   * @returns true if valid
   */
  validateSessionName(sessionName: string): boolean {
    // Zoom session names can be up to 200 characters
    // Alphanumeric, hyphens, underscores allowed
    if (!sessionName || sessionName.length === 0 || sessionName.length > 200) {
      return false;
    }
    // Check for valid characters
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    return validPattern.test(sessionName);
  }

  /**
   * Get SDK Key (Client ID)
   * @returns SDK Key
   */
  getSdkKey(): string {
    return this.clientId;
  }
}

