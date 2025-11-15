import { Injectable, Logger } from '@nestjs/common';
import { MessageQueueService } from './message-queue.service';
import { SpecialtiesService } from '../../specialties/specialties.service';
import { ServicesService } from '../../services/services.service';

@Injectable()
export class SharedServiceHandler {
  private readonly logger = new Logger(SharedServiceHandler.name);

  constructor(
    private readonly messageQueue: MessageQueueService,
    private readonly specialtiesService: SpecialtiesService,
    private readonly servicesService: ServicesService,
  ) {
    this.setupHandlers();
  }

  private setupHandlers() {
    // Handle specialty requests
    this.messageQueue.subscribe('shared.specialties.get', async () => {
      this.logger.log('📥 [SHARED] Handling shared.specialties.get request');
      try {
        const specialties = await this.specialtiesService.findAll();
        this.logger.log(`✅ [SHARED] Returning ${specialties.length} specialties`);
        return specialties;
      } catch (error) {
        this.logger.error(`❌ [SHARED] Error fetching specialties: ${error.message}`);
        throw error;
      }
    });

    this.messageQueue.subscribe('shared.specialties.getByIds', async (data) => {
      this.logger.log('📥 [SHARED] Handling shared.specialties.getByIds request', { specialtyIds: data.specialtyIds });
      try {
        const { specialtyIds } = data;
        const specialties = await this.specialtiesService.findByIds(specialtyIds);
        this.logger.log(`✅ [SHARED] Returning ${specialties.length} specialties by IDs`);
        return specialties;
      } catch (error) {
        this.logger.error(`❌ [SHARED] Error fetching specialties by IDs: ${error.message}`);
        throw error;
      }
    });

    this.messageQueue.subscribe('shared.specialties.verify', async (data) => {
      this.logger.log('📥 [SHARED] Handling shared.specialties.verify request', { specialtyIds: data.specialtyIds });
      try {
        const { specialtyIds } = data;
        const existingSpecialties = await this.specialtiesService.findByIds(specialtyIds);
        const existingIds = existingSpecialties.map(s => s.id);
        const allExist = specialtyIds.every(id => existingIds.includes(id));
        this.logger.log(`✅ [SHARED] Specialty verification result: ${allExist ? 'PASS' : 'FAIL'}`);
        return allExist;
      } catch (error) {
        this.logger.error(`❌ [SHARED] Error verifying specialties: ${error.message}`);
        return false;
      }
    });

    // Handle service requests
    this.messageQueue.subscribe('shared.services.get', async () => {
      this.logger.log('📥 [SHARED] Handling shared.services.get request');
      try {
        const services = await this.servicesService.findAll();
        this.logger.log(`✅ [SHARED] Returning ${services.length} services`);
        return services;
      } catch (error) {
        this.logger.error(`❌ [SHARED] Error fetching services: ${error.message}`);
        throw error;
      }
    });

    this.messageQueue.subscribe('shared.services.getByIds', async (data) => {
      this.logger.log('📥 [SHARED] Handling shared.services.getByIds request', { serviceIds: data.serviceIds });
      try {
        const { serviceIds } = data;
        const services = await this.servicesService.findByIds(serviceIds);
        this.logger.log(`✅ [SHARED] Returning ${services.length} services by IDs`);
        return services;
      } catch (error) {
        this.logger.error(`❌ [SHARED] Error fetching services by IDs: ${error.message}`);
        throw error;
      }
    });

    // Handle health check
    this.messageQueue.subscribe('shared.health.check', async () => {
      this.logger.log('📥 [SHARED] Handling shared.health.check request');
      return { 
        status: 'healthy', 
        service: 'shared-service',
        timestamp: new Date().toISOString() 
      };
    });

    this.logger.log('🎯 [SHARED] Shared service message queue handlers registered');
  }
}
