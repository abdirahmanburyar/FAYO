import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { KafkaService } from '../kafka/kafka.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WebSocketServerService } from '../websocket/websocket-server';
import { SharedServiceClient } from '../common/message-queue/shared-service.client';

@Injectable()
export class HospitalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaService: KafkaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly sharedServiceClient: SharedServiceClient,
  ) {}

  private getWebSocketServer(): WebSocketServerService | null {
    try {
      // Get the WebSocket server from the global variable
      const webSocketServer = (global as any).webSocketServer;
      return webSocketServer || null;
    } catch (error) {
      return null;
    }
  }

  private async broadcastHospitalCreated(hospital: any) {
    try {
      const webSocketServer = this.getWebSocketServer();
      if (webSocketServer) {
        await webSocketServer.broadcastHospitalCreated(hospital);
      }
    } catch (error) {
      // Silently fail - WebSocket is optional
    }
  }

  private async broadcastHospitalUpdated(hospital: any) {
    try {
      const webSocketServer = this.getWebSocketServer();
      if (webSocketServer) {
        await webSocketServer.broadcastHospitalUpdated(hospital);
      }
    } catch (error) {
      // Silently fail - WebSocket is optional
    }
  }

  private async broadcastHospitalDeleted(hospitalId: string) {
    try {
      const webSocketServer = this.getWebSocketServer();
      if (webSocketServer) {
        await webSocketServer.broadcastHospitalDeleted(hospitalId);
      }
    } catch (error) {
      // Silently fail - WebSocket is optional
    }
  }

  async create(createHospitalDto: CreateHospitalDto) {
    try {
      // Check if hospital with same name and city already exists
      const existingHospital = await this.prisma.hospital.findFirst({
        where: {
          name: createHospitalDto.name,
          city: createHospitalDto.city,
        },
      });

      if (existingHospital) {
        throw new ConflictException(
          `Hospital with name "${createHospitalDto.name}" already exists in ${createHospitalDto.city}`,
        );
      }

      const hospital = await this.prisma.hospital.create({
        data: createHospitalDto,
        include: {
          specialties: true,
          services: true,
        },
      });

      // Emit events for real-time updates
      this.eventEmitter.emit('hospital.created', hospital);
      await this.kafkaService.publishHospitalCreated(hospital);
      
      // Broadcast via WebSocket if available
      this.broadcastHospitalCreated(hospital);

      return hospital;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to create hospital: ${error.message}`);
    }
  }

  async findAll() {
    try {
      console.log('🏥 [DEBUG] findAll called');
      
      const hospitals = await this.prisma.hospital.findMany({
        include: {
          specialties: true,
          services: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log('📊 [DEBUG] Found hospitals:', hospitals.length);
      
      // Get all unique service IDs from all hospitals
      const allServiceIds = new Set<string>();
      hospitals.forEach(hospital => {
        hospital.services?.forEach(service => {
          if (service.serviceId) {
            allServiceIds.add(service.serviceId);
          }
        });
      });

      console.log('🔍 [DEBUG] Unique service IDs to fetch:', Array.from(allServiceIds));

      // Fetch all service details in one batch
      const serviceDetailsMap = new Map<string, any>();
      if (allServiceIds.size > 0) {
        try {
          console.log('🔍 [DEBUG] Fetching all services via shared service client...');
          
          const allServices = await this.sharedServiceClient.getServices();
          console.log('✅ [DEBUG] Fetched services via shared service client:', allServices.length);
          
          // Create a map for quick lookup
          allServices.forEach(service => {
            serviceDetailsMap.set(service.id, service);
          });
        } catch (error) {
          console.warn('❌ [DEBUG] Error fetching services via shared service client:', error.message);
        }
      }

        // Map service details to hospital services
        hospitals.forEach(hospital => {
          if (hospital.services && hospital.services.length > 0) {
            (hospital as any).services = hospital.services.map(hospitalService => {
              const serviceDetails = serviceDetailsMap.get(hospitalService.serviceId);
              return {
                id: hospitalService.id,
                hospitalId: hospitalService.hospitalId,
                serviceId: hospitalService.serviceId,
                name: serviceDetails?.name || 'Unknown Service',
                description: serviceDetails?.description || '',
                isActive: hospitalService.isActive,
                createdAt: hospitalService.createdAt,
                updatedAt: hospitalService.updatedAt,
              };
            });
          }
        });

      hospitals.forEach((hospital, index) => {
        console.log(`🏥 [DEBUG] Hospital ${index + 1}:`, {
          id: hospital.id,
          name: hospital.name,
          servicesCount: hospital.services?.length || 0,
          services: hospital.services?.map(s => ({ 
            id: s.id, 
            serviceId: s.serviceId, 
            name: (s as any).name || 'Unknown Service' 
          })) || []
        });
      });

      return hospitals;
    } catch (error) {
      console.error('❌ [DEBUG] Error in findAll:', error);
      throw new Error(`Failed to fetch hospitals: ${error.message}`);
    }
  }

  async findOne(id: string) {
    try {
      console.log('🏥 [DEBUG] findOne called for hospital:', id);
      
      const hospital = await this.prisma.hospital.findUnique({
        where: { id },
        include: {
          specialties: true,
          services: true,
        },
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital with ID ${id} not found`);
      }

      // Fetch service details for this hospital
      if (hospital.services && hospital.services.length > 0) {
        console.log(`🔍 [DEBUG] Fetching service details for hospital ${hospital.name}`);
        
        // Get service IDs for this hospital
        const serviceIds = hospital.services.map(s => s.serviceId).filter(Boolean);
        
        // Fetch service details in one batch
        const serviceDetailsMap = new Map<string, any>();
        if (serviceIds.length > 0) {
          try {
            console.log('🔍 [DEBUG] Fetching services via shared service client...');
            
            const allServices = await this.sharedServiceClient.getServices();
            console.log('✅ [DEBUG] Fetched services via shared service client:', allServices.length);
            
            // Create a map for quick lookup
            allServices.forEach(service => {
              serviceDetailsMap.set(service.id, service);
            });
          } catch (error) {
            console.warn('❌ [DEBUG] Error fetching services via shared service client:', error.message);
          }
        }

        // Map service details to hospital services
        (hospital as any).services = hospital.services.map(hospitalService => {
          const serviceDetails = serviceDetailsMap.get(hospitalService.serviceId);
          return {
            id: hospitalService.id,
            hospitalId: hospitalService.hospitalId,
            serviceId: hospitalService.serviceId,
            name: serviceDetails?.name || 'Unknown Service',
            description: serviceDetails?.description || '',
            isActive: hospitalService.isActive,
            createdAt: hospitalService.createdAt,
            updatedAt: hospitalService.updatedAt,
          };
        });
      }

      console.log('✅ [DEBUG] Hospital fetched successfully:', {
        id: hospital.id,
        name: hospital.name,
        servicesCount: hospital.services?.length || 0
      });

      return hospital;
    } catch (error) {
      console.error('❌ [DEBUG] Error in findOne:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch hospital: ${error.message}`);
    }
  }

  async update(id: string, updateHospitalDto: UpdateHospitalDto) {
    try {
      // Check if hospital exists
      const existingHospital = await this.prisma.hospital.findUnique({
        where: { id },
      });

      if (!existingHospital) {
        throw new NotFoundException(`Hospital with ID ${id} not found`);
      }

      // Check for name and city conflicts if updating name or city
      if (updateHospitalDto.name || updateHospitalDto.city) {
        const name = updateHospitalDto.name || existingHospital.name;
        const city = updateHospitalDto.city || existingHospital.city;

        const conflictingHospital = await this.prisma.hospital.findFirst({
          where: {
            name,
            city,
            id: { not: id },
          },
        });

        if (conflictingHospital) {
          throw new ConflictException(
            `Hospital with name "${name}" already exists in ${city}`,
          );
        }
      }

      const hospital = await this.prisma.hospital.update({
        where: { id },
        data: updateHospitalDto,
        include: {
          specialties: true,
          services: true,
        },
      });

      // Emit events for real-time updates
      this.eventEmitter.emit('hospital.updated', hospital);
      await this.kafkaService.publishHospitalUpdated(hospital);
      
      // Broadcast via WebSocket if available
      this.broadcastHospitalUpdated(hospital);

      return hospital;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to update hospital: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      // Check if hospital exists
      const existingHospital = await this.prisma.hospital.findUnique({
        where: { id },
      });

      if (!existingHospital) {
        throw new NotFoundException(`Hospital with ID ${id} not found`);
      }

      // Note: We can't check for doctors here since doctors are managed by doctor-service
      // The doctor-service should handle the validation when deleting hospitals

      await this.prisma.hospital.delete({
        where: { id },
      });

      // Emit events for real-time updates
      this.eventEmitter.emit('hospital.deleted', { hospitalId: id });
      await this.kafkaService.publishHospitalDeleted(id);
      
      // Broadcast via WebSocket if available
      this.broadcastHospitalDeleted(id);

      return { message: 'Hospital deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to delete hospital: ${error.message}`);
    }
  }

  async getHospitalStats() {
    try {
      const totalHospitals = await this.prisma.hospital.count();
      const activeHospitals = await this.prisma.hospital.count({
        where: { isActive: true },
      });
      const inactiveHospitals = totalHospitals - activeHospitals;

      const cities = await this.prisma.hospital.findMany({
        select: { city: true },
        distinct: ['city'],
      });

      // Note: We can't count doctors here since they're in the doctor-service
      // This would need to be handled by calling the doctor-service API

      return {
        totalHospitals,
        activeHospitals,
        inactiveHospitals,
        totalCities: cities.length,
        totalDoctors: 0, // This would need to be fetched from doctor-service
      };
    } catch (error) {
      throw new Error(`Failed to fetch hospital stats: ${error.message}`);
    }
  }

  // Hospital Specialties Management
  async addSpecialty(hospitalId: string, specialtyId: string) {
    try {
      // Check if hospital exists
      const hospital = await this.prisma.hospital.findUnique({
        where: { id: hospitalId },
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital with ID ${hospitalId} not found`);
      }

      // Check if specialty already exists for this hospital
      const existingSpecialty = await this.prisma.hospitalSpecialty.findUnique({
        where: {
          hospitalId_specialtyId: {
            hospitalId,
            specialtyId,
          },
        },
      });

      if (existingSpecialty) {
        throw new ConflictException('Specialty already exists for this hospital');
      }

      // TODO: Fetch specialty name from shared service
      // For now, we'll use a placeholder
      const specialtyName = 'Specialty Name'; // This should be fetched from shared service

      const hospitalSpecialty = await this.prisma.hospitalSpecialty.create({
        data: {
          hospitalId,
          specialtyId,
          specialtyName,
        },
      });

      return hospitalSpecialty;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to add specialty: ${error.message}`);
    }
  }

  async removeSpecialty(hospitalId: string, specialtyId: string) {
    try {
      const hospitalSpecialty = await this.prisma.hospitalSpecialty.findUnique({
        where: {
          hospitalId_specialtyId: {
            hospitalId,
            specialtyId,
          },
        },
      });

      if (!hospitalSpecialty) {
        throw new NotFoundException('Specialty not found for this hospital');
      }

      await this.prisma.hospitalSpecialty.delete({
        where: {
          hospitalId_specialtyId: {
            hospitalId,
            specialtyId,
          },
        },
      });

      return { message: 'Specialty removed successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to remove specialty: ${error.message}`);
    }
  }

  // Hospital Services Management
  async getServices(hospitalId: string) {
    try {
      console.log('🏥 [DEBUG] getServices called for hospital:', hospitalId);
      
      // Check if hospital exists
      const hospital = await this.prisma.hospital.findUnique({
        where: { id: hospitalId },
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital with ID ${hospitalId} not found`);
      }

      // Get all services for this hospital
      const hospitalServices = await this.prisma.hospitalService.findMany({
        where: { hospitalId },
        select: {
          id: true,
          hospitalId: true,
          serviceId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      console.log('📊 [DEBUG] Found hospital services:', hospitalServices.length);

      if (hospitalServices.length === 0) {
        return [];
      }

      // Get service IDs for this hospital
      const serviceIds = hospitalServices.map(s => s.serviceId).filter(Boolean);
      
      // Fetch service details in one batch
      const serviceDetailsMap = new Map<string, any>();
      if (serviceIds.length > 0) {
        try {
          console.log('🔍 [DEBUG] Fetching services via shared service client...');
          
          const allServices = await this.sharedServiceClient.getServices();
          console.log('✅ [DEBUG] Fetched services via shared service client:', allServices.length);
          
          // Create a map for quick lookup
          allServices.forEach(service => {
            serviceDetailsMap.set(service.id, service);
          });
        } catch (error) {
          console.warn('❌ [DEBUG] Error fetching services via shared service client:', error.message);
        }
      }

      // Map service details to hospital services
      const servicesWithDetails = hospitalServices.map(hospitalService => {
        const serviceDetails = serviceDetailsMap.get(hospitalService.serviceId);
        return {
          id: hospitalService.id,
          hospitalId: hospitalService.hospitalId,
          serviceId: hospitalService.serviceId,
          name: serviceDetails?.name || 'Unknown Service',
          description: serviceDetails?.description || '',
          isActive: hospitalService.isActive,
          createdAt: hospitalService.createdAt,
          updatedAt: hospitalService.updatedAt,
        };
      });

      console.log('✅ [DEBUG] Services with details:', servicesWithDetails.length);
      return servicesWithDetails;
    } catch (error) {
      console.error('❌ [DEBUG] Error in getServices:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch services: ${error.message}`);
    }
  }

  async addService(hospitalId: string, serviceId: string) {
    try {
      console.log('🏥 [DEBUG] addService called with:', { hospitalId, serviceId });
      
      // Check if hospital exists
      const hospital = await this.prisma.hospital.findUnique({
        where: { id: hospitalId },
      });

      if (!hospital) {
        console.log('❌ [DEBUG] Hospital not found:', hospitalId);
        throw new NotFoundException(`Hospital with ID ${hospitalId} not found`);
      }
      console.log('✅ [DEBUG] Hospital found:', hospital.name);

      // Check if service already exists for this hospital
      const existingService = await this.prisma.hospitalService.findUnique({
        where: {
          hospitalId_serviceId: {
            hospitalId,
            serviceId,
          },
        },
      });

      if (existingService) {
        console.log('❌ [DEBUG] Service already exists for this hospital');
        throw new ConflictException('Service already exists for this hospital');
      }
      console.log('✅ [DEBUG] Service does not exist, proceeding to add');

      // Verify service exists in shared service
      const sharedServiceUrl = `${process.env.SHARED_SERVICE_URL || 'http://localhost:3004'}/api/v1/services/${serviceId}`;
      console.log('🔍 [DEBUG] Verifying service exists at:', sharedServiceUrl);
      
      try {
        const sharedServiceResponse = await fetch(sharedServiceUrl);
        console.log('📡 [DEBUG] Shared service response status:', sharedServiceResponse.status);
        
        if (sharedServiceResponse.ok) {
          const serviceData = await sharedServiceResponse.json();
          console.log('📦 [DEBUG] Service data received:', serviceData);
          console.log('✅ [DEBUG] Service verified:', serviceData.name, 'for serviceId:', serviceId);
        } else {
          console.warn('❌ [DEBUG] Service not found in shared service, status:', sharedServiceResponse.status);
          const errorText = await sharedServiceResponse.text();
          console.warn('❌ [DEBUG] Error response:', errorText);
          throw new Error(`Service with ID ${serviceId} not found in shared service`);
        }
      } catch (error) {
        console.warn('❌ [DEBUG] Failed to verify service from shared service:', error.message);
        throw new Error(`Failed to verify service: ${error.message}`);
      }

      console.log('💾 [DEBUG] Creating hospital service with:', { hospitalId, serviceId });

      const hospitalService = await this.prisma.hospitalService.create({
        data: {
          hospitalId,
          serviceId,
        } as any,
      });

      console.log('✅ [DEBUG] Hospital service created successfully:', hospitalService);
      return hospitalService;
    } catch (error) {
      console.error('❌ [DEBUG] Error in addService:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to add service: ${error.message}`);
    }
  }

  async updateServiceNames() {
    try {
      console.log('🔄 [DEBUG] updateServiceNames called - No longer needed as service names are fetched dynamically');
      return { message: 'Service names are now fetched dynamically from shared service' };
    } catch (error) {
      console.error('❌ [DEBUG] Error in updateServiceNames:', error);
      throw new Error(`Failed to update service names: ${error.message}`);
    }
  }

  async removeService(hospitalId: string, serviceId: string) {
    try {
      const hospitalService = await this.prisma.hospitalService.findUnique({
        where: {
          hospitalId_serviceId: {
            hospitalId,
            serviceId,
          },
        },
      });

      if (!hospitalService) {
        throw new NotFoundException('Service not found for this hospital');
      }

      await this.prisma.hospitalService.delete({
        where: {
          hospitalId_serviceId: {
            hospitalId,
            serviceId,
          },
        },
      });

      return { message: 'Service removed successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to remove service: ${error.message}`);
    }
  }

}

