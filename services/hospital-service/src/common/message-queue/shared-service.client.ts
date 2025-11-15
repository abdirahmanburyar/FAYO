import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '../../kafka/kafka.service';

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

  constructor(private readonly kafkaService: KafkaService) {}

  /**
   * Get all specialties from shared service via Kafka
   */
  async getSpecialties(): Promise<Specialty[]> {
    this.logger.log('🔍 [SHARED] Requesting specialties from shared service via Kafka...');
    
    try {
      // For now, we'll use a simple HTTP call as fallback
      // In a real implementation, this would be a Kafka request-response pattern
      const response = await fetch(`${process.env.SHARED_SERVICE_URL || 'http://localhost:3004'}/api/v1/specialties`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch specialties: ${response.status}`);
      }

      const specialties = await response.json();
      this.logger.log(`✅ [SHARED] Successfully fetched ${specialties.length} specialties via HTTP fallback`);
      return specialties;
    } catch (error) {
      this.logger.error(`❌ [SHARED] Error fetching specialties: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get specialties by IDs via Kafka
   */
  async getSpecialtiesByIds(specialtyIds: string[]): Promise<Specialty[]> {
    this.logger.log(`🔍 [SHARED] Requesting specialties by IDs via Kafka: ${specialtyIds.join(', ')}`);
    
    try {
      // For now, we'll use a simple HTTP call as fallback
      const response = await fetch(`${process.env.SHARED_SERVICE_URL || 'http://localhost:3004'}/api/v1/specialties`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch specialties: ${response.status}`);
      }

      const allSpecialties = await response.json();
      const specialties = allSpecialties.filter((s: Specialty) => specialtyIds.includes(s.id));
      
      this.logger.log(`✅ [SHARED] Successfully fetched ${specialties.length} specialties by IDs via HTTP fallback`);
      return specialties;
    } catch (error) {
      this.logger.error(`❌ [SHARED] Error fetching specialties by IDs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify that specialties exist via Kafka
   */
  async verifySpecialtiesExist(specialtyIds: string[]): Promise<boolean> {
    this.logger.log(`🔍 [SHARED] Verifying specialties exist via Kafka: ${specialtyIds.join(', ')}`);
    
    try {
      // For now, we'll use a simple HTTP call as fallback
      const response = await fetch(`${process.env.SHARED_SERVICE_URL || 'http://localhost:3004'}/api/v1/specialties`);
      
      if (!response.ok) {
        this.logger.warn(`⚠️ [SHARED] Specialty verification failed: ${response.status}`);
        return false;
      }

      const specialties = await response.json();
      const existingIds = specialties.map((s: Specialty) => s.id);
      const allExist = specialtyIds.every(id => existingIds.includes(id));
      
      this.logger.log(`✅ [SHARED] Specialty verification result via HTTP fallback: ${allExist ? 'PASS' : 'FAIL'}`);
      return allExist;
    } catch (error) {
      this.logger.error(`❌ [SHARED] Error verifying specialties: ${error.message}`);
      return false;
    }
  }

  /**
   * Get all services from shared service via Kafka
   */
  async getServices(): Promise<Service[]> {
    this.logger.log('🔍 [SHARED] Requesting services from shared service via Kafka...');
    
    try {
      // For now, we'll use a simple HTTP call as fallback
      const response = await fetch(`${process.env.SHARED_SERVICE_URL || 'http://localhost:3004'}/api/v1/services`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.status}`);
      }

      const services = await response.json();
      this.logger.log(`✅ [SHARED] Successfully fetched ${services.length} services via HTTP fallback`);
      return services;
    } catch (error) {
      this.logger.error(`❌ [SHARED] Error fetching services: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get services by IDs via Kafka
   */
  async getServicesByIds(serviceIds: string[]): Promise<Service[]> {
    this.logger.log(`🔍 [SHARED] Requesting services by IDs via Kafka: ${serviceIds.join(', ')}`);
    
    try {
      // For now, we'll use a simple HTTP call as fallback
      const response = await fetch(`${process.env.SHARED_SERVICE_URL || 'http://localhost:3004'}/api/v1/services`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.status}`);
      }

      const allServices = await response.json();
      const services = allServices.filter((s: Service) => serviceIds.includes(s.id));
      
      this.logger.log(`✅ [SHARED] Successfully fetched ${services.length} services by IDs via HTTP fallback`);
      return services;
    } catch (error) {
      this.logger.error(`❌ [SHARED] Error fetching services by IDs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Health check for shared service via Kafka
   */
  async healthCheck(): Promise<boolean> {
    this.logger.log('🏥 [SHARED] Performing health check via Kafka...');
    
    try {
      // For now, we'll use a simple HTTP call as fallback
      const response = await fetch(`${process.env.SHARED_SERVICE_URL || 'http://localhost:3004'}/api/v1/health`);
      
      if (!response.ok) {
        this.logger.warn(`⚠️ [SHARED] Health check failed: ${response.status}`);
        return false;
      }

      this.logger.log(`✅ [SHARED] Health check successful via HTTP fallback`);
      return true;
    } catch (error) {
      this.logger.error(`❌ [SHARED] Health check error: ${error.message}`);
      return false;
    }
  }
}
