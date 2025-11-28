import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class SpecialtyServiceClient {
  private readonly logger = new Logger(SpecialtyServiceClient.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('SPECIALTY_SERVICE_URL') || 'http://localhost:3004';
  }

  async getSpecialties(includeInactive = false): Promise<Specialty[]> {
    try {
      const url = `${this.baseUrl}/api/v1/specialties${includeInactive ? '?includeInactive=true' : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch specialties: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Error fetching specialties: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getSpecialtyById(id: string): Promise<Specialty> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/specialties/${id}`, {
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
      this.logger.error(`Error fetching specialty ${id}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async verifySpecialtiesExist(specialtyIds: string[]): Promise<boolean> {
    try {
      if (!specialtyIds || specialtyIds.length === 0) {
        return false;
      }

      // Fetch all specialties and check if all IDs exist
      const specialties = await this.getSpecialties(true);
      const specialtyIdsSet = new Set(specialties.map(s => s.id));
      
      return specialtyIds.every(id => specialtyIdsSet.has(id));
    } catch (error) {
      this.logger.error(`Error verifying specialties: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  async getSpecialtiesByIds(specialtyIds: string[]): Promise<Specialty[]> {
    try {
      if (!specialtyIds || specialtyIds.length === 0) {
        return [];
      }

      const allSpecialties = await this.getSpecialties(true);
      const specialtyMap = new Map(allSpecialties.map(s => [s.id, s]));
      
      return specialtyIds
        .map(id => specialtyMap.get(id))
        .filter((s): s is Specialty => s !== undefined);
    } catch (error) {
      this.logger.error(`Error fetching specialties by IDs: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
}

