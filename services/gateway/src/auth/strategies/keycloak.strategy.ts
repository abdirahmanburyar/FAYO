import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor() {
    super({
      authorizationURL: `${process.env.KEYCLOAK_URL || 'http://localhost:8080'}/realms/${process.env.KEYCLOAK_REALM || 'fayo'}/protocol/openid-connect/auth`,
      tokenURL: `${process.env.KEYCLOAK_URL || 'http://localhost:8080'}/realms/${process.env.KEYCLOAK_REALM || 'fayo'}/protocol/openid-connect/token`,
      clientID: process.env.KEYCLOAK_CLIENT_ID || 'fayo-web',
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'your-client-secret',
      callbackURL: process.env.KEYCLOAK_CALLBACK_URL || 'http://localhost:3000/auth/keycloak/callback',
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return {
      accessToken,
      refreshToken,
      profile,
    };
  }
}
