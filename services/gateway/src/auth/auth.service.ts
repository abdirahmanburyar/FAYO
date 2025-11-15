import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';

@Injectable()
export class AuthService {
  private readonly keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
  private readonly keycloakRealm = process.env.KEYCLOAK_REALM || 'fayo';
  private readonly keycloakClientId = process.env.KEYCLOAK_CLIENT_ID || 'fayo-web';

  constructor(private readonly jwtService: JwtService) {}

  async validateKeycloakToken(token: string) {
    try {
      const response = await axios.get(
        `${this.keycloakUrl}/realms/${this.keycloakRealm}/protocol/openid-connect/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      return null;
    }
  }

  async exchangeKeycloakToken(keycloakToken: string) {
    const userInfo = await this.validateKeycloakToken(keycloakToken);
    
    if (!userInfo) {
      throw new Error('Invalid Keycloak token');
    }

    // Create internal JWT token
    const payload = {
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      preferred_username: userInfo.preferred_username,
      roles: userInfo.realm_access?.roles || [],
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: userInfo,
    };
  }

  async validateJwtToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      return null;
    }
  }
}
