import { Injectable, Logger } from '@nestjs/common';

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class SharedServiceClient {
  private readonly logger = new Logger(SharedServiceClient.name);
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.SHARED_SERVICE_URL || 'http://localhost:3004';
  }

  /**
   * Get all specialties from shared service via HTTP
   */
  async getSpecialties(): Promise<Specialty[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/specialties`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch specialties: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Error fetching specialties: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get specialties by IDs via HTTP
   */
  async getSpecialtiesByIds(specialtyIds: string[]): Promise<Specialty[]> {
    if (!Array.isArray(specialtyIds) || specialtyIds.length === 0) {
      return [];
    }

    try {
      // Try bulk endpoint first, fallback to fetching all
      const urlWithIds = `${this.baseUrl}/api/v1/specialties?ids=${encodeURIComponent(specialtyIds.join(','))}`;
      let response = await fetch(urlWithIds, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        // Fallback to fetching all and filtering
        response = await fetch(`${this.baseUrl}/api/v1/specialties`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch specialties: ${response.status} ${response.statusText}`);
        }
        
        const allSpecialties = await response.json();
        return (Array.isArray(allSpecialties) ? allSpecialties : []).filter((s: Specialty) => specialtyIds.includes(s.id));
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Error fetching specialties by IDs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify that specialties exist
   */
  async verifySpecialtiesExist(specialtyIds: string[]): Promise<boolean> {
    try {
      const allSpecialties = await this.getSpecialties();
      const availableIds = allSpecialties.map(s => s.id);
      const allExist = specialtyIds.every(id => availableIds.includes(id));
      
      return allExist;
    } catch (error) {
      this.logger.error(`Error verifying specialties: ${error.message}`);
      return false;
    }
  }

  /**
   * Get all services from shared service via HTTP
   */
  async getServices(): Promise<Service[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/services`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Error fetching services: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get services by IDs via HTTP
   */
  async getServicesByIds(serviceIds: string[]): Promise<Service[]> {
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return [];
    }

    try {
      // Try bulk endpoint first, fallback to fetching all
      const urlWithIds = `${this.baseUrl}/api/v1/services?ids=${encodeURIComponent(serviceIds.join(','))}`;
      let response = await fetch(urlWithIds, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        // Fallback to fetching all and filtering
        response = await fetch(`${this.baseUrl}/api/v1/services`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch services: ${response.status} ${response.statusText}`);
        }
        
        const allServices = await response.json();
        return (Array.isArray(allServices) ? allServices : []).filter((s: Service) => serviceIds.includes(s.id));
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Error fetching services by IDs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Health check for shared service via HTTP
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        this.logger.warn(`Health check failed: ${response.status}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Health check error: ${error.message}`);
      return false;
    }
  }
}
