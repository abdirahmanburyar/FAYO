import { Injectable, Logger } from '@nestjs/common';
import { MessageQueueService } from './message-queue.service';

@Injectable()
export class MockSharedServiceHandler {
  private readonly logger = new Logger(MockSharedServiceHandler.name);

  // Mock data for testing
  private mockSpecialties = [
    {
      id: 'cmgavhplu0000wcgllh2yl4fi',
      name: 'Cardiology',
      description: 'Heart and cardiovascular system specialist',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cmgavhplu0001wcgllh2yl4fj',
      name: 'Dermatology',
      description: 'Skin, hair, and nail specialist',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cmgavhplu0002wcgllh2yl4fk',
      name: 'Neurology',
      description: 'Nervous system specialist',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cmgavhplu0003wcgllh2yl4fl',
      name: 'Pediatrics',
      description: 'Children\'s health specialist',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cmgavhplu0004wcgllh2yl4fm',
      name: 'Orthopedics',
      description: 'Bone and joint specialist',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cmgavhplu0005wcgllh2yl4fn',
      name: 'Gastroenterology',
      description: 'Digestive system disorders',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cmgavhplu0006wcgllh2yl4fo',
      name: 'Endocrinology',
      description: 'Hormone and metabolic disorders',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cmgavhplu0007wcgllh2yl4fp',
      name: 'Pulmonology',
      description: 'Respiratory system disorders',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cmgavhplu0008wcgllh2yl4fq',
      name: 'Nephrology',
      description: 'Kidney and urinary system',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cmgavhplu0009wcgllh2yl4fr',
      name: 'Rheumatology',
      description: 'Joint and autoimmune disorders',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private mockServices = [
    {
      id: 'svc_1',
      name: 'Emergency Care',
      description: '24/7 emergency medical services',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'svc_2',
      name: 'Surgery',
      description: 'Surgical procedures and operations',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'svc_3',
      name: 'Radiology',
      description: 'Medical imaging and diagnostic services',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  constructor(private readonly messageQueue: MessageQueueService) {
    this.logger.warn('⚠️ [MOCK] Using mock shared service handler. This should only be used for development/testing.');
    this.setupHandlers();
  }

  private setupHandlers() {
    // Handle specialty requests
    this.messageQueue.subscribe('shared.specialties.get', async () => {
      this.logger.log('📥 [MOCK] Handling shared.specialties.get request');
      return this.mockSpecialties;
    });

    this.messageQueue.subscribe('shared.specialties.getByIds', async (data) => {
      this.logger.log('📥 [MOCK] Handling shared.specialties.getByIds request', { specialtyIds: data.specialtyIds });
      const { specialtyIds } = data;
      return this.mockSpecialties.filter(specialty => specialtyIds.includes(specialty.id));
    });

    this.messageQueue.subscribe('shared.specialties.verify', async (data) => {
      this.logger.log('📥 [MOCK] Handling shared.specialties.verify request', { specialtyIds: data.specialtyIds });
      const { specialtyIds } = data;
      const existingIds = this.mockSpecialties.map(s => s.id);
      const allExist = specialtyIds.every(id => existingIds.includes(id));
      this.logger.log(`✅ [MOCK] Specialty verification result: ${allExist ? 'PASS' : 'FAIL'}`);
      return allExist;
    });

    // Handle service requests
    this.messageQueue.subscribe('shared.services.get', async () => {
      this.logger.log('📥 [MOCK] Handling shared.services.get request');
      return this.mockServices;
    });

    this.messageQueue.subscribe('shared.services.getByIds', async (data) => {
      this.logger.log('📥 [MOCK] Handling shared.services.getByIds request', { serviceIds: data.serviceIds });
      const { serviceIds } = data;
      return this.mockServices.filter(service => serviceIds.includes(service.id));
    });

    // Handle health check
    this.messageQueue.subscribe('shared.health.check', async () => {
      this.logger.log('📥 [MOCK] Handling shared.health.check request');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    });

    this.logger.log('🎯 [MOCK] Mock shared service handlers registered');
  }

  /**
   * Add a new specialty for testing
   */
  addMockSpecialty(specialty: any) {
    this.mockSpecialties.push({
      ...specialty,
      id: specialty.id || `spec_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.logger.log(`➕ [MOCK] Added specialty: ${specialty.name}`);
  }

  /**
   * Add a new service for testing
   */
  addMockService(service: any) {
    this.mockServices.push({
      ...service,
      id: service.id || `svc_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.logger.log(`➕ [MOCK] Added service: ${service.name}`);
  }

  /**
   * Get all mock specialties
   */
  getMockSpecialties() {
    return this.mockSpecialties;
  }

  /**
   * Get all mock services
   */
  getMockServices() {
    return this.mockServices;
  }
}
