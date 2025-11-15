import { Injectable, Logger } from '@nestjs/common';
import { MessageQueueService } from './message-queue.service';

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

  constructor(private readonly messageQueue: MessageQueueService) {}

  /**
   * Get all specialties from shared service
   */
  async getSpecialties(): Promise<Specialty[]> {
    try {
      const response = await this.messageQueue.sendMessage('shared.specialties.get', {});
      
      if (!response.success) {
        throw new Error(`Failed to fetch specialties: ${response.error}`);
      }

      return response.data || [];
    } catch (error) {
      this.logger.error(`Error fetching specialties: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get specialties by IDs
   */
  async getSpecialtiesByIds(specialtyIds: string[]): Promise<Specialty[]> {
    try {
      const response = await this.messageQueue.sendMessage('shared.specialties.getByIds', {
        specialtyIds,
      });
      
      if (!response.success) {
        throw new Error(`Failed to fetch specialties by IDs: ${response.error}`);
      }

      return response.data || [];
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
   * Get all services from shared service
   */
  async getServices(): Promise<Service[]> {
    try {
      const response = await this.messageQueue.sendMessage('shared.services.get', {});
      
      if (!response.success) {
        throw new Error(`Failed to fetch services: ${response.error}`);
      }

      return response.data || [];
    } catch (error) {
      this.logger.error(`Error fetching services: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get services by IDs
   */
  async getServicesByIds(serviceIds: string[]): Promise<Service[]> {
    try {
      const response = await this.messageQueue.sendMessage('shared.services.getByIds', {
        serviceIds,
      });
      
      if (!response.success) {
        throw new Error(`Failed to fetch services by IDs: ${response.error}`);
      }

      return response.data || [];
    } catch (error) {
      this.logger.error(`Error fetching services by IDs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Health check for shared service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.messageQueue.sendMessage('shared.health.check', {});
      
      if (!response.success) {
        this.logger.warn(`Health check failed: ${response.error}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Health check error: ${error.message}`);
      return false;
    }
  }
}
