import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { SpecialtiesService } from '../specialties/specialties.service';
import { UsersService } from '../users/users.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  private specialtiesCache: Map<string, any> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate: number = 0;

  constructor(
    private prisma: PrismaService,
    private specialtiesService: SpecialtiesService,
    private usersService: UsersService,
  ) {}

  async create(createDoctorDto: CreateDoctorDto) {
    try {
      const { specialtyIds, ...doctorData } = createDoctorDto;
      
      // Validate specialtyIds
      if (!specialtyIds || !Array.isArray(specialtyIds)) {
        throw new Error('specialtyIds must be an array');
      }
      
      if (specialtyIds.length === 0) {
        throw new Error('At least one specialty must be provided');
      }
      
      // Validate specialtyIds format
      if (specialtyIds.some(id => !id || typeof id !== 'string')) {
        throw new Error('All specialtyIds must be valid strings');
      }
      
      // Verify specialties exist - use direct service call
      const allSpecialties = await this.specialtiesService.findAll(true);
      const specialtyIdsSet = new Set(allSpecialties.map(s => s.id));
      const allExist = specialtyIds.every(id => specialtyIdsSet.has(id));
      
      if (!allExist) {
        throw new NotFoundException('One or more specialties not found');
      }
      
      // Clean doctorData
      const cleanedDoctorData: any = {
        userId: doctorData.userId,
        licenseNumber: doctorData.licenseNumber,
        experience: doctorData.experience,
        isVerified: doctorData.isVerified ?? false,
        isAvailable: doctorData.isAvailable ?? true,
        selfEmployedConsultationFee: doctorData.selfEmployedConsultationFee ?? null,
        bio: doctorData.bio && doctorData.bio.trim() !== '' ? doctorData.bio.trim() : null,
        education: doctorData.education && doctorData.education.trim() !== '' ? doctorData.education.trim() : null,
        certifications: doctorData.certifications && doctorData.certifications.trim() !== '' ? doctorData.certifications.trim() : null,
        languages: doctorData.languages && doctorData.languages.trim() !== '' ? doctorData.languages.trim() : null,
        awards: doctorData.awards && doctorData.awards.trim() !== '' ? doctorData.awards.trim() : null,
        publications: doctorData.publications && doctorData.publications.trim() !== '' ? doctorData.publications.trim() : null,
        memberships: doctorData.memberships && doctorData.memberships.trim() !== '' ? doctorData.memberships.trim() : null,
        researchInterests: doctorData.researchInterests && doctorData.researchInterests.trim() !== '' ? doctorData.researchInterests.trim() : null,
        imageUrl: doctorData.imageUrl && doctorData.imageUrl.trim() !== '' ? doctorData.imageUrl.trim() : null,
      };
      
      const doctor = await this.prisma.doctor.create({
        data: {
          ...cleanedDoctorData,
          doctorSpecialties: {
            create: specialtyIds.map(specialtyId => ({
              specialtyId,
            })),
          },
        },
        include: {
          doctorSpecialties: true,
        },
      });
      
      return this.enrichDoctorWithSpecialties(doctor);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Doctor with this license number already exists');
      }
      throw error;
    }
  }

  async findAll(options?: { page?: number; limit?: number; search?: string }) {
    try {
      const searchQuery = options?.search?.trim();
      const hasSearch = searchQuery && searchQuery.length > 0;
      const page = options?.page || 1;
      const limit = options?.limit;

      const allDoctors = await this.prisma.doctor.findMany({
        include: {
          doctorSpecialties: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Enrich doctors with specialty details
      const enrichedDoctors = await Promise.all(allDoctors.map(async (doctor) => {
        try {
          return await this.enrichDoctorWithSpecialties(doctor);
        } catch (error) {
          return {
            ...doctor,
            specialties: [],
          };
        }
      }));

      // Fetch user data for each doctor - use direct service call
      const doctorsWithUsers = await Promise.all(enrichedDoctors.map(async (doctor) => {
        let doctorWithUser;
        try {
          const userData = await this.usersService.findOne(doctor.userId);
          doctorWithUser = {
            ...doctor,
            user: userData
          };
        } catch (error) {
          doctorWithUser = {
            ...doctor,
            user: null
          };
        }
        
        // Extract specialty from specialties array for frontend compatibility
        let specialtyName = 'General Practice';
        if (doctorWithUser.specialties && Array.isArray(doctorWithUser.specialties) && doctorWithUser.specialties.length > 0) {
          const activeSpecialty = doctorWithUser.specialties.find((s: any) => s.isActive !== false);
          specialtyName = activeSpecialty?.name || doctorWithUser.specialties[0]?.name || 'General Practice';
        }
        
        return {
          ...doctorWithUser,
          specialty: specialtyName
        };
      }));

      // Apply search filter if provided
      let filteredDoctors = doctorsWithUsers;
      if (hasSearch) {
        const searchLower = searchQuery.toLowerCase();
        filteredDoctors = doctorsWithUsers.filter((doctor: any) => {
          const firstName = doctor.user?.firstName?.toLowerCase() || '';
          const lastName = doctor.user?.lastName?.toLowerCase() || '';
          const fullName = `${firstName} ${lastName}`.trim();
          const nameMatch = fullName.includes(searchLower) || firstName.includes(searchLower) || lastName.includes(searchLower);
          const specialtyMatch = doctor.specialty?.toLowerCase().includes(searchLower) || false;
          const specialtiesMatch = doctor.specialties?.some((s: any) => 
            s.name?.toLowerCase().includes(searchLower)
          ) || false;
          
          return nameMatch || specialtyMatch || specialtiesMatch;
        });
      }

      // Apply pagination
      let paginatedDoctors = filteredDoctors;
      if (limit) {
        const skip = (page - 1) * limit;
        paginatedDoctors = filteredDoctors.slice(skip, skip + limit);
      }
      
      return paginatedDoctors;
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const doctor = await this.prisma.doctor.findUnique({
        where: { id },
        include: {
          doctorSpecialties: true,
        },
      });

      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }

      // Enrich doctor with specialty details
      let enrichedDoctor;
      try {
        enrichedDoctor = await this.enrichDoctorWithSpecialties(doctor);
      } catch (error) {
        enrichedDoctor = {
          ...doctor,
          specialties: [],
        };
      }
      
      // Fetch user data - use direct service call
      try {
        const userData = await this.usersService.findOne(doctor.userId);
        const doctorWithUser = {
          ...enrichedDoctor,
          user: userData
        };
        
        // Extract specialty from specialties array
        let specialtyName = 'General Practice';
        if (doctorWithUser.specialties && Array.isArray(doctorWithUser.specialties) && doctorWithUser.specialties.length > 0) {
          const activeSpecialty = doctorWithUser.specialties.find((s: any) => s.isActive !== false);
          specialtyName = activeSpecialty?.name || doctorWithUser.specialties[0]?.name || 'General Practice';
        }
        
        return {
          ...doctorWithUser,
          specialty: specialtyName
        };
      } catch (error) {
        const doctorWithoutUser = {
          ...enrichedDoctor,
          user: null
        };
        
        let specialtyName = 'General Practice';
        if (doctorWithoutUser.specialties && Array.isArray(doctorWithoutUser.specialties) && doctorWithoutUser.specialties.length > 0) {
          const activeSpecialty = doctorWithoutUser.specialties.find((s: any) => s.isActive !== false);
          specialtyName = activeSpecialty?.name || doctorWithoutUser.specialties[0]?.name || 'General Practice';
        }
        
        return {
          ...doctorWithoutUser,
          specialty: specialtyName
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto) {
    try {
      const { specialtyIds, ...doctorData } = updateDoctorDto;
      
      // Clean doctorData
      const cleanedDoctorData: any = {};
      
      if (doctorData.licenseNumber !== undefined) {
        cleanedDoctorData.licenseNumber = doctorData.licenseNumber;
      }
      if (doctorData.experience !== undefined) {
        cleanedDoctorData.experience = doctorData.experience;
      }
      if (doctorData.isVerified !== undefined) {
        cleanedDoctorData.isVerified = doctorData.isVerified;
      }
      if (doctorData.isAvailable !== undefined) {
        cleanedDoctorData.isAvailable = doctorData.isAvailable;
      }
      if (doctorData.selfEmployedConsultationFee !== undefined) {
        cleanedDoctorData.selfEmployedConsultationFee = doctorData.selfEmployedConsultationFee > 0 ? doctorData.selfEmployedConsultationFee : null;
      }
      if (doctorData.bio !== undefined) {
        cleanedDoctorData.bio = doctorData.bio && doctorData.bio.trim() !== '' ? doctorData.bio.trim() : null;
      }
      if (doctorData.education !== undefined) {
        cleanedDoctorData.education = doctorData.education && doctorData.education.trim() !== '' ? doctorData.education.trim() : null;
      }
      if (doctorData.certifications !== undefined) {
        cleanedDoctorData.certifications = doctorData.certifications && doctorData.certifications.trim() !== '' ? doctorData.certifications.trim() : null;
      }
      if (doctorData.languages !== undefined) {
        cleanedDoctorData.languages = doctorData.languages && doctorData.languages.trim() !== '' ? doctorData.languages.trim() : null;
      }
      if (doctorData.awards !== undefined) {
        cleanedDoctorData.awards = doctorData.awards && doctorData.awards.trim() !== '' ? doctorData.awards.trim() : null;
      }
      if (doctorData.publications !== undefined) {
        cleanedDoctorData.publications = doctorData.publications && doctorData.publications.trim() !== '' ? doctorData.publications.trim() : null;
      }
      if (doctorData.memberships !== undefined) {
        cleanedDoctorData.memberships = doctorData.memberships && doctorData.memberships.trim() !== '' ? doctorData.memberships.trim() : null;
      }
      if (doctorData.researchInterests !== undefined) {
        cleanedDoctorData.researchInterests = doctorData.researchInterests && doctorData.researchInterests.trim() !== '' ? doctorData.researchInterests.trim() : null;
      }
      if (doctorData.imageUrl !== undefined) {
        cleanedDoctorData.imageUrl = doctorData.imageUrl && doctorData.imageUrl.trim() !== '' ? doctorData.imageUrl.trim() : null;
      }
      
      const hasDataToUpdate = Object.keys(cleanedDoctorData).length > 0;
      const hasSpecialtyIds = specialtyIds !== undefined;
      
      if (!hasDataToUpdate && !hasSpecialtyIds) {
        const currentDoctor = await this.prisma.doctor.findUnique({
          where: { id },
          include: { doctorSpecialties: true },
        });
        if (!currentDoctor) {
          throw new NotFoundException('Doctor not found');
        }
        return this.enrichDoctorWithSpecialties(currentDoctor);
      }
      
      // If specialtyIds are provided, validate and update them
      if (specialtyIds !== undefined) {
        if (!Array.isArray(specialtyIds)) {
          throw new Error('specialtyIds must be an array');
        }
        
        if (specialtyIds.some(id => !id || typeof id !== 'string')) {
          throw new Error('All specialtyIds must be valid strings');
        }
        
        // Verify specialties exist - use direct service call
        if (specialtyIds.length > 0) {
          try {
            const allSpecialties = await this.specialtiesService.findAll(true);
            const specialtyIdsSet = new Set(allSpecialties.map(s => s.id));
            const allExist = specialtyIds.every(id => specialtyIdsSet.has(id));
            if (!allExist) {
              throw new NotFoundException('One or more specialties not found');
            }
          } catch (error) {
            if (error instanceof NotFoundException) {
              throw error;
            }
            // Graceful degradation if specialty service is unavailable
          }
        }
        
        // Update doctor with specialty relations
        const updateData: any = {};
        
        if (specialtyIds.length > 0) {
          updateData.doctorSpecialties = {
            deleteMany: {},
            create: specialtyIds.map(specialtyId => ({
              specialtyId,
            })),
          };
        } else {
          updateData.doctorSpecialties = {
            deleteMany: {},
          };
        }
        
        if (hasDataToUpdate) {
          Object.assign(updateData, cleanedDoctorData);
        }
        
        const updatedDoctor = await this.prisma.doctor.update({
          where: { id },
          data: updateData,
          include: {
            doctorSpecialties: true,
          },
        });
        
        try {
          return await this.enrichDoctorWithSpecialties(updatedDoctor);
        } catch (enrichError) {
          return {
            ...updatedDoctor,
            specialties: [],
          };
        }
      } else {
        // No specialtyIds provided, just update other fields
        if (!hasDataToUpdate) {
          const currentDoctor = await this.prisma.doctor.findUnique({
            where: { id },
            include: { doctorSpecialties: true },
          });
          if (!currentDoctor) {
            throw new NotFoundException('Doctor not found');
          }
          return this.enrichDoctorWithSpecialties(currentDoctor);
        }
        
        const updatedDoctor = await this.prisma.doctor.update({
          where: { id },
          data: cleanedDoctorData,
          include: {
            doctorSpecialties: true,
          },
        });
        
        try {
          return await this.enrichDoctorWithSpecialties(updatedDoctor);
        } catch (enrichError) {
          return {
            ...updatedDoctor,
            specialties: [],
          };
        }
      }
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Doctor not found');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Doctor with this license number already exists');
      }
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const deletedDoctor = await this.prisma.doctor.delete({
        where: { id },
      });
      
      return deletedDoctor;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Doctor not found');
      }
      throw error;
    }
  }

  async assignToHospital(doctorId: string, hospitalId: string, assignHospitalDto: any) {
    try {
      const { startTime, endTime, consultationFee } = assignHospitalDto;
      
      const doctor = await this.prisma.doctor.findUnique({
        where: { id: doctorId },
      });

      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }

      // Check if assignment already exists
      const existingAssignment = await this.prisma.hospitalDoctor.findUnique({
        where: {
          doctorId_hospitalId: {
            doctorId,
            hospitalId,
          },
        },
      });

      if (existingAssignment) {
        // Update existing assignment
        const updatedAssignment = await this.prisma.hospitalDoctor.update({
          where: {
            doctorId_hospitalId: {
              doctorId,
              hospitalId,
            },
          },
          data: {
            startTime: startTime || null,
            endTime: endTime || null,
            consultationFee: consultationFee || null,
          },
          include: {
            hospital: true,
          },
        });
        
        return updatedAssignment;
      }

      // Create new hospital assignment
      const assignment = await this.prisma.hospitalDoctor.create({
        data: {
          doctorId,
          hospitalId,
          startTime: startTime || null,
          endTime: endTime || null,
          consultationFee: consultationFee || null,
        },
        include: {
          hospital: true,
        },
      });
      
      return assignment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
  }

  async removeFromHospital(doctorId: string, hospitalId: string) {
    try {
      const assignment = await this.prisma.hospitalDoctor.findUnique({
        where: {
          doctorId_hospitalId: {
            doctorId,
            hospitalId,
          },
        },
      });

      if (!assignment) {
        throw new NotFoundException('Doctor assignment not found');
      }

      const deletedAssignment = await this.prisma.hospitalDoctor.delete({
        where: {
          doctorId_hospitalId: {
            doctorId,
            hospitalId,
          },
        },
      });
      
      return deletedAssignment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  async updateHospitalRole(doctorId: string, hospitalId: string, role: string) {
    // Note: Role is not stored in doctor-service schema
    throw new BadRequestException(
      'Role update is not supported in doctor-service. Role is derived from doctor specialty. Please use hospital-service to update role if needed.'
    );
  }

  async getDoctorHospitals(doctorId: string) {
    try {
      const assignments = await this.prisma.hospitalDoctor.findMany({
        where: { doctorId },
        include: {
          hospital: true,
        },
      });
      
      return assignments;
    } catch (error) {
      throw error;
    }
  }

  async getHospitalDoctors(hospitalId: string) {
    try {
      const assignments = await this.prisma.hospitalDoctor.findMany({
        where: { hospitalId },
      });
      
      return assignments;
    } catch (error) {
      throw error;
    }
  }

  async addSpecialty(doctorId: string, specialtyId: string) {
    try {
      // Verify specialty exists - use direct service call
      try {
        await this.specialtiesService.findOne(specialtyId);
      } catch (error) {
        throw new NotFoundException('Specialty not found');
      }

      const doctorSpecialty = await this.prisma.doctorSpecialty.create({
        data: {
          doctorId,
          specialtyId,
        },
      });
      
      return doctorSpecialty;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Doctor already has this specialty');
      }
      throw error;
    }
  }

  async removeSpecialty(doctorId: string, specialtyId: string) {
    try {
      const deletedSpecialty = await this.prisma.doctorSpecialty.delete({
        where: {
          doctorId_specialtyId: {
            doctorId,
            specialtyId,
          },
        },
      });
      
      return deletedSpecialty;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Doctor specialty not found');
      }
      throw error;
    }
  }

  async getDoctorSpecialties(doctorId: string) {
    try {
      const doctorSpecialties = await this.prisma.doctorSpecialty.findMany({
        where: { doctorId },
      });
      
      // Fetch specialty details - use direct service call
      const specialtyIds = doctorSpecialties.map(ds => ds.specialtyId);
      const specialties = await Promise.all(
        specialtyIds.map(async (id) => {
          try {
            return await this.specialtiesService.findOne(id);
          } catch {
            return null;
          }
        })
      );
      
      return doctorSpecialties.map(ds => {
        const specialty = specialties.find(s => s && s.id === ds.specialtyId);
        return {
          ...ds,
          specialty: specialty || null,
        };
      });
    } catch (error) {
      throw error;
    }
  }

  async getAllSpecialties() {
    try {
      // Fetch all specialties - use direct service call
      return await this.specialtiesService.findAll();
    } catch (error) {
      throw error;
    }
  }

  private async getCachedSpecialtiesByIds(specialtyIds: string[]): Promise<any[]> {
    if (!Array.isArray(specialtyIds) || specialtyIds.length === 0) return [];
    
    try {
      const cachedNow = Date.now();
      const isExpired = (cachedNow - this.lastCacheUpdate) > this.cacheExpiry;
      const resultsFromCache: any[] = [];
      const missingIds: string[] = [];
      
      for (const id of specialtyIds) {
        const cached = !isExpired ? this.specialtiesCache.get(id) : undefined;
        if (cached) {
          resultsFromCache.push(cached);
        } else {
          missingIds.push(id);
        }
      }
      
      // Fetch missing specialties - use direct service call
      let fetched: any[] = [];
      if (missingIds.length > 0 || isExpired) {
        const toFetch = isExpired ? specialtyIds : missingIds;
        try {
          const allSpecialties = await this.specialtiesService.findAll(true);
          fetched = allSpecialties.filter(s => toFetch.includes(s.id));
          
          // Update cache
          const now = Date.now();
          if (isExpired) this.specialtiesCache.clear();
          for (const s of fetched) {
            this.specialtiesCache.set(s.id, s);
          }
          this.lastCacheUpdate = now;
        } catch (error) {
          return resultsFromCache;
        }
      }
      
      // Return in requested order
      const mergedMap = new Map<string, any>();
      for (const s of resultsFromCache) mergedMap.set(s.id, s);
      for (const s of fetched) mergedMap.set(s.id, s);
      return specialtyIds.map(id => mergedMap.get(id)).filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  private async enrichDoctorWithSpecialties(doctor: any): Promise<any> {
    try {
      if (!doctor.doctorSpecialties || doctor.doctorSpecialties.length === 0) {
        return {
          ...doctor,
          specialties: []
        };
      }

      // Fetch specialty details - use direct service call
      const specialtyIds = doctor.doctorSpecialties.map((ds: any) => ds.specialtyId);
      const specialties = await this.getCachedSpecialtiesByIds(specialtyIds);
      const specialtyMap = new Map(specialties.map((s: any) => [s.id, s]));
      
      const enrichedSpecialties = doctor.doctorSpecialties.map((ds: any) => {
        const specialty = specialtyMap.get(ds.specialtyId);
        return {
          id: ds.specialtyId,
          name: specialty?.name || 'Unknown Specialty',
          description: specialty?.description || null,
          isActive: ds.isActive,
          createdAt: ds.createdAt,
          updatedAt: ds.updatedAt,
        };
      });

      return {
        ...doctor,
        specialties: enrichedSpecialties,
      };
    } catch (error) {
      return {
        ...doctor,
        specialties: [],
      };
    }
  }
}

