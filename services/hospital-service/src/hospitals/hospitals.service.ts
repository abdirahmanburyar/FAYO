import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { SpecialtyServiceClient } from '../common/specialty-service/specialty-service.client';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { AddDoctorDto } from './dto/add-doctor.dto';
import { KafkaService } from '../kafka/kafka.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WebSocketServerService } from '../websocket/websocket-server';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HospitalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaService: KafkaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly specialtyServiceClient: SpecialtyServiceClient,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
    let createdUserId: string | null = null;
    
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

      // If userId is not provided, create a new user in user-service first
      if (!createHospitalDto.userId) {
        console.log('[HOSPITAL-CREATE] No userId provided, creating new user in user-service...');
        
        const userServiceUrl = this.configService.get('USER_SERVICE_URL') || 'http://31.97.58.62:3001';
        const createUserUrl = `${userServiceUrl}/api/v1/users`;
        
        try {
          // Create user with hospital manager role
          const userData = {
            firstName: createHospitalDto.name,
            lastName: 'Hospital',
            email: createHospitalDto.email || `${createHospitalDto.name.toLowerCase().replace(/\s+/g, '_')}@hospital.com`,
            phone: createHospitalDto.phone || '',
            role: 'HOSPITAL',
            userType: 'HOSPITAL_MANAGER',
            username: Math.floor(100000 + Math.random() * 900000).toString(), // Generate 6-digit username
            password: Math.random().toString(36).slice(-8), // Generate random password
          };

          console.log('[HOSPITAL-CREATE] Creating user:', { email: userData.email, username: userData.username });
          
          const userResponse = await firstValueFrom(
            this.httpService.post(createUserUrl, userData)
          );

          if (userResponse.data && userResponse.data.id) {
            createdUserId = userResponse.data.id;
            createHospitalDto.userId = createdUserId;
            console.log('[HOSPITAL-CREATE] ✅ User created successfully:', createdUserId);
          } else {
            throw new Error('User creation failed: No user ID returned');
          }
        } catch (error) {
          console.error('[HOSPITAL-CREATE] ❌ Failed to create user:', error.response?.data || error.message);
          throw new Error(`Failed to create user for hospital: ${error.response?.data?.message || error.message}`);
        }
      }

      // Use Prisma transaction to create hospital atomically
      console.log('[HOSPITAL-CREATE] Creating hospital in transaction...');
      const hospital = await this.prisma.$transaction(async (tx) => {
        const hospital = await tx.hospital.create({
          data: createHospitalDto,
          include: {
            specialties: true,
            services: true,
          },
        });
        
        console.log('[HOSPITAL-CREATE] ✅ Hospital created in transaction:', hospital.id);
        return hospital;
      });

      console.log('[HOSPITAL-CREATE] ✅ Transaction completed successfully');

      // Emit events for real-time updates (only after successful transaction)
      this.eventEmitter.emit('hospital.created', hospital);
      await this.kafkaService.publishHospitalCreated(hospital);
      
      // Broadcast via WebSocket if available
      this.broadcastHospitalCreated(hospital);

      return hospital;
    } catch (error) {
      // If hospital creation failed but user was created, delete the user (compensating transaction)
      if (createdUserId) {
        console.error('[HOSPITAL-CREATE] ❌ Hospital creation failed, rolling back user creation...');
        try {
          const userServiceUrl = this.configService.get('USER_SERVICE_URL') || 'http://31.97.58.62:3001';
          const deleteUserUrl = `${userServiceUrl}/api/v1/users/${createdUserId}`;
          
          await firstValueFrom(
            this.httpService.delete(deleteUserUrl)
          );
          console.log('[HOSPITAL-CREATE] ✅ User rollback successful:', createdUserId);
        } catch (rollbackError) {
          console.error('[HOSPITAL-CREATE] ❌ Failed to rollback user creation:', rollbackError.message);
          // Log but don't throw - the main error is more important
        }
      }

      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to create hospital: ${error.message}`);
    }
  }

  async findAll(options?: { page?: number; limit?: number; search?: string }) {
    try {
      // Trim and validate search query
      const searchQuery = options?.search?.trim();
      const hasSearch = searchQuery && searchQuery.length > 0;
      
      // Use provided page (allows pagination of search results)
      const page = options?.page || 1;
      const limit = options?.limit;
      
      console.log('🏥 [DEBUG] findAll called', { 
        page, 
        limit, 
        search: searchQuery, 
        hasSearch
      });
      
      // Build where clause for search using contains (LIKE) - matches anywhere in the string
      // Note: type is an enum, so we can't use contains on it
      // We'll search in name, city, and address fields
      // contains with mode: 'insensitive' works like SQL: WHERE name ILIKE '%searchQuery%'
      const where = hasSearch
        ? {
            OR: [
              { name: { contains: searchQuery, mode: 'insensitive' as const } },
              { city: { contains: searchQuery, mode: 'insensitive' as const } },
              { address: { contains: searchQuery, mode: 'insensitive' as const } },
            ],
          }
        : undefined;

      console.log('🔍 [DEBUG] Where clause:', JSON.stringify(where, null, 2));

      // First, get total count with the where clause to verify filtering
      const totalCount = await this.prisma.hospital.count({
        where,
      }).catch((error) => {
        console.error('❌ [DEBUG] Prisma count error:', error);
        return 0;
      });
      
      console.log('📊 [DEBUG] Total count with filter:', totalCount);

      // Calculate skip for pagination
      const skip = limit ? (page - 1) * limit : undefined;
      
      const hospitals = await this.prisma.hospital.findMany({
        where,
        include: {
          specialties: true,
          services: {
            include: {
              service: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }).catch((error) => {
        console.error('❌ [DEBUG] Prisma error in findAll:', error);
        console.error('❌ [DEBUG] Error details:', {
          message: error?.message,
          code: error?.code,
          meta: error?.meta,
        });
        throw error;
      });

      console.log('📊 [DEBUG] Found hospitals:', hospitals.length);
      
      // Debug: Log first few hospital names to verify filtering
      if (hasSearch) {
        console.log('🔍 [DEBUG] Search query:', searchQuery);
        console.log('🔍 [DEBUG] Total hospitals found:', hospitals.length);
        if (hospitals.length > 0) {
          console.log('🔍 [DEBUG] First hospital matches:', {
            name: hospitals[0].name,
            city: hospitals[0].city,
            address: hospitals[0].address,
            type: hospitals[0].type,
            nameContains: hospitals[0].name.toLowerCase().includes(searchQuery.toLowerCase()),
            cityContains: hospitals[0].city.toLowerCase().includes(searchQuery.toLowerCase()),
          });
        } else {
          console.log('🔍 [DEBUG] No hospitals found matching search query');
        }
      }
      
      // Fetch all specialty IDs from all hospitals
      const allSpecialtyIds = new Set<string>();
      hospitals.forEach((hospital: any) => {
        if (hospital.specialties && Array.isArray(hospital.specialties)) {
          hospital.specialties.forEach((hs: any) => {
            if (hs.specialtyId) {
              allSpecialtyIds.add(hs.specialtyId);
            }
          });
        }
      });

      // Fetch specialty details from specialty-service
      const specialtiesMap = new Map<string, any>();
      if (allSpecialtyIds.size > 0) {
        try {
          const specialties = await this.specialtyServiceClient.getSpecialtiesByIds(Array.from(allSpecialtyIds));
          specialties.forEach(s => specialtiesMap.set(s.id, s));
        } catch (error) {
          console.warn('Failed to fetch specialties from specialty-service:', error);
        }
      }

      // Enrich hospitals with specialty and service details
      const enrichedHospitals = hospitals.map((hospital: any) => ({
        ...hospital,
        specialties: (hospital.specialties || []).map((hs: any) => {
          const specialty = specialtiesMap.get(hs.specialtyId);
          return {
            id: hs.id,
            hospitalId: hs.hospitalId,
            specialtyId: hs.specialtyId,
            name: specialty?.name || 'Unknown Specialty',
            description: specialty?.description || null,
            isActive: hs.isActive,
            createdAt: hs.createdAt,
            updatedAt: hs.updatedAt,
          };
        }),
        services: (hospital.services || []).map((hs: any) => ({
          id: hs.id,
          hospitalId: hs.hospitalId,
          serviceId: hs.serviceId,
          name: hs.service?.name || 'Unknown Service',
          description: hs.service?.description || null,
          isActive: hs.isActive,
          createdAt: hs.createdAt,
          updatedAt: hs.updatedAt,
        })),
      }));

      return enrichedHospitals;
    } catch (error) {
      console.error('❌ [DEBUG] Error in findAll:', error);
      throw new Error(`Failed to fetch hospitals: ${error.message}`);
    }
  }

  async findByUserId(userId: string) {
    try {
      const hospital = await this.prisma.hospital.findUnique({
        where: { userId },
        include: {
          specialties: true,
          services: true,
        },
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital not found for user ID: ${userId}`);
      }

      return hospital;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to find hospital by user ID: ${error.message}`);
    }
  }

  async findOne(id: string) {
    try {
      console.log('🏥 [DEBUG] findOne called for hospital:', id);
      
      const hospital = await this.prisma.hospital.findUnique({
        where: { id },
        include: {
          specialties: true,
          services: {
            include: {
              service: true,
            },
          },
        },
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital with ID ${id} not found`);
      }

      // Fetch specialty details from specialty-service
      const specialtyIds = ((hospital as any).specialties || []).map((hs: any) => hs.specialtyId).filter(Boolean);
      const specialties = await this.specialtyServiceClient.getSpecialtiesByIds(specialtyIds);
      const specialtiesMap = new Map(specialties.map(s => [s.id, s]));

      // Enrich hospital with specialty and service details
      const enrichedHospital = {
        ...hospital,
        specialties: ((hospital as any).specialties || []).map((hs: any) => {
          const specialty = specialtiesMap.get(hs.specialtyId);
          return {
            id: hs.id,
            hospitalId: hs.hospitalId,
            specialtyId: hs.specialtyId,
            name: specialty?.name || 'Unknown Specialty',
            description: specialty?.description || null,
            isActive: hs.isActive,
            createdAt: hs.createdAt,
            updatedAt: hs.updatedAt,
          };
        }),
        services: ((hospital as any).services || []).map((hs: any) => ({
          id: hs.id,
          hospitalId: hs.hospitalId,
          serviceId: hs.serviceId,
          name: hs.service?.name || 'Unknown Service',
          description: hs.service?.description || null,
          isActive: hs.isActive,
          createdAt: hs.createdAt,
          updatedAt: hs.updatedAt,
        })),
      };

      console.log('✅ [DEBUG] Hospital fetched successfully:', {
        id: enrichedHospital.id,
        name: enrichedHospital.name,
        servicesCount: enrichedHospital.services?.length || 0
      });

      return enrichedHospital;
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

      // Verify specialty exists in specialty-service
      const exists = await this.specialtyServiceClient.verifySpecialtyExists(specialtyId);
      if (!exists) {
        throw new NotFoundException(`Specialty with ID ${specialtyId} not found in specialty-service`);
      }

      const hospitalSpecialty = await this.prisma.hospitalSpecialty.create({
        data: {
          hospitalId,
          specialtyId,
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

      // Fetch services with details from database
      const servicesWithDetails = await this.prisma.hospitalService.findMany({
        where: { hospitalId },
        include: {
          service: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      console.log('📊 [DEBUG] Found hospital services:', servicesWithDetails.length);

      if (servicesWithDetails.length === 0) {
        return [];
      }

      // Fetch service details (services are still in hospital-service database)
      const enrichedServices = servicesWithDetails.map(hospitalService => ({
        id: hospitalService.id,
        hospitalId: hospitalService.hospitalId,
        serviceId: hospitalService.serviceId,
        name: hospitalService.service?.name || 'Unknown Service',
        description: hospitalService.service?.description || null,
        isActive: hospitalService.isActive,
        createdAt: hospitalService.createdAt,
        updatedAt: hospitalService.updatedAt,
      }));

      console.log('✅ [DEBUG] Services with details:', enrichedServices.length);
      return enrichedServices;
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

      // Verify service exists in database
      const service = await this.prisma.service.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        throw new NotFoundException(`Service with ID ${serviceId} not found`);
      }

      console.log('💾 [DEBUG] Creating hospital service with:', { hospitalId, serviceId });

      const hospitalService = await this.prisma.hospitalService.create({
        data: {
          hospitalId,
          serviceId,
        },
        include: {
          service: true,
        },
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

  // Hospital Doctors Management
  async getDoctors(hospitalId: string) {
    try {
      const hospital = await this.prisma.hospital.findUnique({
        where: { id: hospitalId },
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital with ID ${hospitalId} not found`);
      }

      const hospitalDoctors = await this.prisma.hospitalDoctor.findMany({
        where: { hospitalId },
        include: {
          doctor: true,
        },
      });

      // Fetch doctor details from doctor-service
      const doctorIds = hospitalDoctors.map(hd => hd.doctorId);
      const doctorsMap = new Map();
      
      // Fetch doctors from doctor-service
      if (doctorIds.length > 0) {
        try {
          const doctorServiceUrl = this.configService.get<string>('DOCTOR_SERVICE_URL') || 'http://localhost:3003';
          console.log(`🏥 [DEBUG] Fetching ${doctorIds.length} doctors from doctor-service for hospital ${hospitalId}`);
          console.log(`🏥 [DEBUG] Doctor IDs to fetch:`, doctorIds);
          
          const response = await firstValueFrom(
            this.httpService.get(`${doctorServiceUrl}/api/v1/doctors`)
          ) as any;
          
          // Handle different response structures (response.data or direct array)
          const doctors = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
          
          console.log(`🏥 [DEBUG] Received ${doctors.length} doctors from doctor-service`);
          
          // Filter and map doctors that belong to this hospital
          doctors.forEach((doctor: any) => {
            if (doctor && doctor.id && doctorIds.includes(doctor.id)) {
              // Extract specialty from specialties array (doctor-service returns specialties array)
              // Use first active specialty name, or first specialty if none are active
              let specialtyName = '';
              if (doctor.specialties && Array.isArray(doctor.specialties) && doctor.specialties.length > 0) {
                const activeSpecialty = doctor.specialties.find((s: any) => s.isActive !== false);
                specialtyName = activeSpecialty?.name || doctor.specialties[0]?.name || '';
              } else if (doctor.specialty) {
                // Fallback to direct specialty field if it exists
                specialtyName = doctor.specialty;
              }
              
              // Add specialty field for frontend compatibility
              const enrichedDoctor = {
                ...doctor,
                specialty: specialtyName || 'General Practice' // Default if no specialty found
              };
              
              doctorsMap.set(doctor.id, enrichedDoctor);
              console.log(`✅ [DEBUG] Mapped doctor ${doctor.id} for hospital ${hospitalId}`, {
                hasUser: !!doctor.user,
                userId: doctor.userId,
                specialty: enrichedDoctor.specialty,
                specialtiesCount: doctor.specialties?.length || 0
              });
            }
          });
          
          console.log(`🏥 [DEBUG] Successfully mapped ${doctorsMap.size} doctors for hospital ${hospitalId}`);
          const missingDoctorIds = doctorIds.filter(id => !doctorsMap.has(id));
          console.log(`🏥 [DEBUG] Missing doctors:`, missingDoctorIds);
          
          // Try to fetch missing doctors individually
          if (missingDoctorIds.length > 0) {
            console.log(`🔄 [DEBUG] Attempting to fetch ${missingDoctorIds.length} missing doctors individually`);
            for (const doctorId of missingDoctorIds) {
              try {
                const doctorResponse = await firstValueFrom(
                  this.httpService.get(`${doctorServiceUrl}/api/v1/doctors/${doctorId}`)
                ) as any;
                
                const doctor = doctorResponse?.data || doctorResponse;
                if (doctor && doctor.id) {
                  // Extract specialty from specialties array
                  let specialtyName = '';
                  if (doctor.specialties && Array.isArray(doctor.specialties) && doctor.specialties.length > 0) {
                    const activeSpecialty = doctor.specialties.find((s: any) => s.isActive !== false);
                    specialtyName = activeSpecialty?.name || doctor.specialties[0]?.name || '';
                  } else if (doctor.specialty) {
                    specialtyName = doctor.specialty;
                  }
                  
                  const enrichedDoctor = {
                    ...doctor,
                    specialty: specialtyName || 'General Practice'
                  };
                  
                  doctorsMap.set(doctor.id, enrichedDoctor);
                  console.log(`✅ [DEBUG] Fetched individual doctor ${doctor.id} for hospital ${hospitalId}`, {
                    specialty: enrichedDoctor.specialty
                  });
                }
              } catch (individualError) {
                console.warn(`⚠️ [DEBUG] Failed to fetch individual doctor ${doctorId}:`, individualError.message);
              }
            }
          }
        } catch (error) {
          console.error(`❌ [DEBUG] Error fetching doctors from doctor-service for hospital ${hospitalId}:`, error);
          // Continue with local doctor data if available
        }
      }

      // Map hospital doctors with enriched doctor data
      const enrichedHospitalDoctors = hospitalDoctors.map(hd => {
        const enrichedDoctor = doctorsMap.get(hd.doctorId) || hd.doctor;
        const result = {
          ...hd,
          doctor: enrichedDoctor,
        };
        
        // Log if doctor data is missing
        if (!enrichedDoctor) {
          console.warn(`⚠️ [DEBUG] Hospital doctor ${hd.id} has no doctor data for doctorId ${hd.doctorId}`);
        } else if (!enrichedDoctor.user) {
          console.warn(`⚠️ [DEBUG] Doctor ${enrichedDoctor.id} has no user data`);
        }
        
        return result;
      });

      console.log(`🏥 [DEBUG] Returning ${enrichedHospitalDoctors.length} hospital doctors for hospital ${hospitalId}`);
      console.log(`🏥 [DEBUG] Doctors with data:`, enrichedHospitalDoctors.filter(hd => hd.doctor).length);
      console.log(`🏥 [DEBUG] Doctors without data:`, enrichedHospitalDoctors.filter(hd => !hd.doctor).length);
      return enrichedHospitalDoctors;
    } catch (error) {
      console.error('Error fetching hospital doctors:', error);
      throw error;
    }
  }

  async addDoctor(hospitalId: string, doctorId: string, addDoctorDto: AddDoctorDto) {
    try {
      console.log('🏥 [HOSPITAL_SERVICE] addDoctor called:', { hospitalId, doctorId, addDoctorDto });
      const { role, shift, startTime, endTime, consultationFee, status } = addDoctorDto;

      // Check if hospital exists
      const hospital = await this.prisma.hospital.findUnique({
        where: { id: hospitalId },
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital with ID ${hospitalId} not found`);
      }

      // Verify doctor exists in doctor-service and sync to local database
      try {
        const doctorServiceUrl = this.configService.get<string>('DOCTOR_SERVICE_URL') || 'http://localhost:3003';
        const doctorResponse = await firstValueFrom(
          this.httpService.get(`${doctorServiceUrl}/api/v1/doctors/${doctorId}`)
        ) as any;
        
        const doctorData = doctorResponse?.data;
        if (!doctorData) {
          throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
        }

        // Ensure doctor exists in local database (for foreign key constraint)
        const localDoctor = await this.prisma.doctor.findUnique({
          where: { id: doctorId },
        });

        if (!localDoctor) {
          // Create a minimal doctor record for the foreign key relationship
          // Note: This is a sync record, full doctor data is in doctor-service
          await this.prisma.doctor.upsert({
            where: { id: doctorId },
            create: {
              id: doctorId,
              userId: doctorData.userId || doctorId, // Fallback if userId not available
              specialty: doctorData.specialties?.[0]?.name || 'GENERAL', // Use first specialty or default
              licenseNumber: doctorData.licenseNumber || `LIC-${doctorId.substring(0, 8)}`,
              experience: doctorData.experience || 0,
              isVerified: doctorData.isVerified || false,
              isAvailable: doctorData.isAvailable !== false,
            },
            update: {
              // Update if exists but data changed
              userId: doctorData.userId || undefined,
              specialty: doctorData.specialties?.[0]?.name || undefined,
              licenseNumber: doctorData.licenseNumber || undefined,
            },
          });
          console.log('✅ [HOSPITAL_SERVICE] Synced doctor to local database:', doctorId);
        }
      } catch (error: any) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        if (error.response?.status === 404) {
          throw new NotFoundException(`Doctor with ID ${doctorId} not found in doctor-service`);
        }
        console.error('❌ [HOSPITAL_SERVICE] Error verifying/syncing doctor:', error);
        throw new NotFoundException(`Doctor with ID ${doctorId} not found: ${error?.message || 'Unknown error'}`);
      }

      // Check if association already exists
      const existing = await this.prisma.hospitalDoctor.findUnique({
        where: {
          doctorId_hospitalId: {
            doctorId,
            hospitalId,
          },
        },
      });

      if (existing) {
        throw new ConflictException('Doctor is already associated with this hospital');
      }

      // Create hospital-doctor association
      // Note: We don't include doctor relation as it's in a different service/database
      const hospitalDoctor = await this.prisma.hospitalDoctor.create({
        data: {
          doctorId,
          hospitalId,
          role: role || 'CONSULTANT',
          shift: shift || null,
          startTime: startTime || null,
          endTime: endTime || null,
          consultationFee: consultationFee ? Math.round(consultationFee) : null,
          status: status || 'ACTIVE',
        },
      });

      console.log('✅ [HOSPITAL_SERVICE] Doctor added successfully:', hospitalDoctor);
      return hospitalDoctor;
    } catch (error) {
      console.error('❌ [HOSPITAL_SERVICE] Error adding doctor to hospital:', error);
      console.error('❌ [HOSPITAL_SERVICE] Error details:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        meta: error?.meta,
      });
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      // Re-throw with more context
      throw new Error(`Failed to add doctor to hospital: ${error?.message || 'Unknown error'}`);
    }
  }

  async updateDoctor(hospitalId: string, doctorId: string, updateDoctorDto: AddDoctorDto) {
    try {
      const { role, shift, startTime, endTime, consultationFee, status } = updateDoctorDto;

      // Check if association exists
      const existing = await this.prisma.hospitalDoctor.findUnique({
        where: {
          doctorId_hospitalId: {
            doctorId,
            hospitalId,
          },
        },
      });

      if (!existing) {
        throw new NotFoundException('Doctor is not associated with this hospital');
      }

      // Update association
      const updateData: any = {};
      if (role !== undefined) updateData.role = role;
      if (shift !== undefined) updateData.shift = shift;
      if (startTime !== undefined) updateData.startTime = startTime;
      if (endTime !== undefined) updateData.endTime = endTime;
      if (consultationFee !== undefined) updateData.consultationFee = consultationFee ? Math.round(consultationFee) : null;
      if (status !== undefined) updateData.status = status;

      const hospitalDoctor = await this.prisma.hospitalDoctor.update({
        where: {
          doctorId_hospitalId: {
            doctorId,
            hospitalId,
          },
        },
        data: updateData,
        include: {
          doctor: true,
        },
      });

      return hospitalDoctor;
    } catch (error) {
      console.error('Error updating doctor association:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  async getHospitalsForDoctor(doctorId: string) {
    try {
      const hospitalDoctors = await this.prisma.hospitalDoctor.findMany({
        where: { doctorId },
        include: {
          hospital: true,
        },
      });

      return hospitalDoctors.map(hd => ({
        id: hd.id,
        doctorId: hd.doctorId,
        hospitalId: hd.hospitalId,
        role: hd.role,
        shift: hd.shift,
        startTime: hd.startTime,
        endTime: hd.endTime,
        consultationFee: hd.consultationFee,
        status: hd.status,
        joinedAt: hd.joinedAt,
        leftAt: hd.leftAt,
        createdAt: hd.createdAt,
        updatedAt: hd.updatedAt,
        hospital: hd.hospital,
      }));
    } catch (error) {
      console.error('Error fetching hospitals for doctor:', error);
      throw error;
    }
  }

  async removeDoctor(hospitalId: string, doctorId: string) {
    try {
      const existing = await this.prisma.hospitalDoctor.findUnique({
        where: {
          doctorId_hospitalId: {
            doctorId,
            hospitalId,
          },
        },
      });

      if (!existing) {
        throw new NotFoundException('Doctor is not associated with this hospital');
      }

      await this.prisma.hospitalDoctor.delete({
        where: {
          doctorId_hospitalId: {
            doctorId,
            hospitalId,
          },
        },
      });
    } catch (error) {
      console.error('Error removing doctor from hospital:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }
}

