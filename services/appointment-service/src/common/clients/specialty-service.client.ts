import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SpecialtyServiceClient {
  private readonly logger = new Logger(SpecialtyServiceClient.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('SPECIALTY_SERVICE_URL') || 'http://localhost:3004';
  }

  async getSpecialtyById(specialtyId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/specialties/${specialtyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch specialty: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Error fetching specialty ${specialtyId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

