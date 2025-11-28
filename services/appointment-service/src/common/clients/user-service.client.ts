import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserServiceClient {
  private readonly logger = new Logger(UserServiceClient.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('USER_SERVICE_URL') || 'http://31.97.58.62:3001';
  }

  async getUserById(userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch user: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Error fetching user ${userId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async validateUser(userId: string): Promise<boolean> {
    try {
      await this.getUserById(userId);
      return true;
    } catch (error) {
      return false;
    }
  }
}

