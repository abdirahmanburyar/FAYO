import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { SpecialtiesService } from '../specialties/specialties.service';
import { UsersService } from '../users/users.service';
import { DoctorsService } from '../doctors/doctors.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { AddDoctorDto } from './dto/add-doctor.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class HospitalsService {
  private readonly logger = new Logger(HospitalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly specialtiesService: SpecialtiesService,
    private readonly usersService: UsersService,
    private readonly doctorsService: DoctorsService,
    private readonly notificationsService: NotificationsService,
  ) {}

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

      // If userId is not provided, create a new user - use direct service call
      if (!createHospitalDto.userId) {
        const userData = {
          firstName: createHospitalDto.name,
          lastName: 'Hospital',
          email: createHospitalDto.email || `${createHospitalDto.name.toLowerCase().replace(/\s+/g, '_')}@hospital.com`,
          phone: createHospitalDto.phone || '',
          role: 'HOSPITAL' as any,
          userType: 'HOSPITAL_MANAGER' as any,
          username: Math.floor(100000 + Math.random() * 900000).toString(),
          password: Math.random().toString(36).slice(-8),
        };

        try {
          const user = await this.usersService.create(userData);
          createdUserId = user.id;
          createHospitalDto.userId = createdUserId;
        } catch (error) {
          throw new Error(`Failed to create user for hospital: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Create hospital
      const hospital = await this.prisma.hospital.create({
        data: createHospitalDto,
        include: {
          specialties: true,
          services: true,
        },
      });

      // Emit events for real-time updates
      this.eventEmitter.emit('hospital.created', hospital);

      return hospital;
    } catch (error) {
      // If hospital creation failed but user was created, delete the user (compensating transaction)
      if (createdUserId) {
        try {
          await this.usersService.remove(createdUserId);
        } catch (rollbackError) {
          // Log but don't throw - the main error is more important
        }
      }

      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to create hospital: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findAll(options?: { page?: number; limit?: number; search?: string }) {
    try {
      const searchQuery = options?.search?.trim();
      const hasSearch = searchQuery && searchQuery.length > 0;
      const page = options?.page || 1;
      const limit = options?.limit;

      const where = hasSearch
        ? {
            OR: [
              { name: { contains: searchQuery, mode: 'insensitive' as const } },
              { city: { contains: searchQuery, mode: 'insensitive' as const } },
              { address: { contains: searchQuery, mode: 'insensitive' as const } },
            ],
          }
        : undefined;

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
      });

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

      // Fetch specialty details - use direct service call
      const specialtiesMap = new Map<string, any>();
      if (allSpecialtyIds.size > 0) {
        try {
          const specialties = await this.specialtiesService.findAll(true);
          const relevantSpecialties = specialties.filter(s => allSpecialtyIds.has(s.id));
          relevantSpecialties.forEach(s => specialtiesMap.set(s.id, s));
        } catch (error) {
          // Graceful degradation
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
      throw new Error(`Failed to fetch hospitals: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Failed to find hospital by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findOne(id: string) {
    try {
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

      // Fetch specialty details - use direct service call
      const specialtyIds = ((hospital as any).specialties || []).map((hs: any) => hs.specialtyId).filter(Boolean);
      const specialties = await Promise.all(
        specialtyIds.map(async (id: string) => {
          try {
            return await this.specialtiesService.findOne(id);
          } catch {
            return null;
          }
        })
      );
      const specialtiesMap = new Map(specialties.filter(Boolean).map(s => [s.id, s]));

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

      return enrichedHospital;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch hospital: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async update(id: string, updateHospitalDto: UpdateHospitalDto) {
    try {
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

      return hospital;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to update hospital: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async remove(id: string) {
    try {
      const existingHospital = await this.prisma.hospital.findUnique({
        where: { id },
      });

      if (!existingHospital) {
        throw new NotFoundException(`Hospital with ID ${id} not found`);
      }

      await this.prisma.hospital.delete({
        where: { id },
      });

      // Emit events for real-time updates
      this.eventEmitter.emit('hospital.deleted', { hospitalId: id });

      return { message: 'Hospital deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to delete hospital: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      // Count doctors - use direct service call
      let totalDoctors = 0;
      try {
        const doctors = await this.doctorsService.findAll();
        totalDoctors = Array.isArray(doctors) ? doctors.length : 0;
      } catch (error) {
        // Graceful degradation
      }

      return {
        totalHospitals,
        activeHospitals,
        inactiveHospitals,
        totalCities: cities.length,
        totalDoctors,
      };
    } catch (error) {
      throw new Error(`Failed to fetch hospital stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addSpecialty(hospitalId: string, specialtyId: string) {
    try {
      const hospital = await this.prisma.hospital.findUnique({
        where: { id: hospitalId },
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital with ID ${hospitalId} not found`);
      }

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

      // Verify specialty exists - use direct service call
      try {
        await this.specialtiesService.findOne(specialtyId);
      } catch (error) {
        throw new NotFoundException(`Specialty with ID ${specialtyId} not found`);
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
      throw new Error(`Failed to add specialty: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Failed to remove specialty: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getServices(hospitalId: string) {
    try {
      const hospital = await this.prisma.hospital.findUnique({
        where: { id: hospitalId },
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital with ID ${hospitalId} not found`);
      }

      const servicesWithDetails = await this.prisma.hospitalService.findMany({
        where: { hospitalId },
        include: {
          service: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (servicesWithDetails.length === 0) {
        return [];
      }

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

      return enrichedServices;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch services: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addService(hospitalId: string, serviceId: string) {
    try {
      const hospital = await this.prisma.hospital.findUnique({
        where: { id: hospitalId },
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital with ID ${hospitalId} not found`);
      }

      const existingService = await this.prisma.hospitalService.findUnique({
        where: {
          hospitalId_serviceId: {
            hospitalId,
            serviceId,
          },
        },
      });

      if (existingService) {
        throw new ConflictException('Service already exists for this hospital');
      }

      const service = await this.prisma.service.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        throw new NotFoundException(`Service with ID ${serviceId} not found`);
      }

      const hospitalService = await this.prisma.hospitalService.create({
        data: {
          hospitalId,
          serviceId,
        },
        include: {
          service: true,
        },
      });

      return hospitalService;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to add service: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Failed to remove service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

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
      });

      // Fetch doctor details - use direct service call
      const doctorIds = hospitalDoctors.map(hd => hd.doctorId);
      const doctorsMap = new Map();
      
      if (doctorIds.length > 0) {
        try {
          const allDoctors = await this.doctorsService.findAll();
          const relevantDoctors = Array.isArray(allDoctors) 
            ? allDoctors.filter((d: any) => d && d.id && doctorIds.includes(d.id))
            : [];
          
          relevantDoctors.forEach((doctor: any) => {
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
          });
        } catch (error) {
          // Graceful degradation
        }
      }

      // Map hospital doctors with enriched doctor data
      // Convert consultationFee from cents to dollars for API response
      const enrichedHospitalDoctors = hospitalDoctors.map(hd => {
        const enrichedDoctor = doctorsMap.get(hd.doctorId);
        return {
          ...hd,
          consultationFee: hd.consultationFee != null ? hd.consultationFee / 100 : null,
          doctor: enrichedDoctor || null,
        };
      });

      return enrichedHospitalDoctors;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  async addDoctor(hospitalId: string, doctorId: string, addDoctorDto: AddDoctorDto) {
    try {
      const { role, shift, startTime, endTime, consultationFee, status } = addDoctorDto;

      const hospital = await this.prisma.hospital.findUnique({
        where: { id: hospitalId },
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital with ID ${hospitalId} not found`);
      }

      // Verify doctor exists - use direct service call
      try {
        await this.doctorsService.findOne(doctorId);
      } catch (error) {
        throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
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
      // consultationFee is expected in dollars from the API, convert to cents for storage
      const consultationFeeInCents = consultationFee 
        ? Math.round(consultationFee * 100) 
        : null;
      
      const hospitalDoctor = await this.prisma.hospitalDoctor.create({
        data: {
          doctorId,
          hospitalId,
          role: role || 'CONSULTANT',
          shift: shift || null,
          startTime: startTime || null,
          endTime: endTime || null,
          consultationFee: consultationFeeInCents,
          status: status || 'ACTIVE',
        },
      });

      // Notify users about new doctor at hospital
      try {
        this.logger.log(`📢 Triggering new doctor notification for hospital ${hospital.name} (${hospitalId})`);
        const doctor = await this.doctorsService.findOne(doctorId);
        const doctorName = doctor.user?.firstName && doctor.user?.lastName
          ? `${doctor.user.firstName} ${doctor.user.lastName}`
          : doctor.user?.firstName || doctor.user?.email || 'New Doctor';
        
        const specialtyName = doctor.specialties && doctor.specialties.length > 0
          ? doctor.specialties[0].name
          : undefined;

        this.logger.log(`   Doctor: ${doctorName}${specialtyName ? ` (${specialtyName})` : ''}`);

        const notificationResult = await this.notificationsService.notifyNewDoctorAtHospital(
          hospitalId,
          hospital.name,
          doctorId,
          doctorName,
          specialtyName
        );

        if (notificationResult?.success) {
          this.logger.log(`✅ Successfully sent notifications about new doctor ${doctorName} at ${hospital.name}`);
          this.logger.log(`   Delivered to ${notificationResult.successCount || 0} device(s)`);
        } else {
          this.logger.warn(`⚠️ Notification sent but may have failed: ${notificationResult?.message || 'Unknown error'}`);
        }
      } catch (notificationError) {
        // Don't fail the operation if notification fails
        this.logger.error(`❌ Failed to send new doctor notification:`, notificationError);
        this.logger.error(`   Hospital: ${hospital.name} (${hospitalId}), Doctor: ${doctorId}`);
      }

      return hospitalDoctor;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to add doctor to hospital: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateDoctor(hospitalId: string, doctorId: string, updateDoctorDto: AddDoctorDto) {
    try {
      const { role, shift, startTime, endTime, consultationFee, status } = updateDoctorDto;

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

      const updateData: any = {};
      if (role !== undefined) updateData.role = role;
      if (shift !== undefined) updateData.shift = shift;
      if (startTime !== undefined) updateData.startTime = startTime;
      if (endTime !== undefined) updateData.endTime = endTime;
      // consultationFee is expected in dollars from the API, convert to cents for storage
      if (consultationFee !== undefined) {
        updateData.consultationFee = consultationFee ? Math.round(consultationFee * 100) : null;
      }
      if (status !== undefined) updateData.status = status;

      const hospitalDoctor = await this.prisma.hospitalDoctor.update({
        where: {
          doctorId_hospitalId: {
            doctorId,
            hospitalId,
          },
        },
        data: updateData,
      });

      return hospitalDoctor;
    } catch (error) {
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
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }
}

