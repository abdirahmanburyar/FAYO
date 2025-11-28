import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { SpecialtyServiceClient } from '../common/specialty-service/specialty-service.client';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  private specialtiesCache: Map<string, any> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate: number = 0;

  constructor(
    private prisma: PrismaService,
    private specialtyServiceClient: SpecialtyServiceClient,
  ) {}

  // shared-service removed - specialty fetching methods removed

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
      
      // Verify specialties exist in specialty-service
      const allExist = await this.specialtyServiceClient.verifySpecialtiesExist(specialtyIds);
      if (!allExist) {
        throw new NotFoundException('One or more specialties not found in specialty-service');
      }
      
      // Clean doctorData: convert empty strings to undefined for optional fields
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
      };
      
      console.log('📝 [SERVICE] Creating doctor with data:', cleanedDoctorData);
      
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

      console.log('✅ [SERVICE] Doctor created successfully:', doctor.id);
      
      // Return doctor with enriched specialties from database
      return this.enrichDoctorWithSpecialties(doctor);
    } catch (error) {
      console.error('❌ [SERVICE] Error creating doctor:', error);
      if (error.code === 'P2002') {
        throw new ConflictException('Doctor with this license number already exists');
      }
      throw error;
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

      console.log('👨‍⚕️ [DEBUG] findAll called', {
        page,
        limit,
        search: searchQuery,
        hasSearch
      });

      // First, fetch all doctors (we need user data for search, so we'll filter after fetching users)
      // For better performance with search, we could optimize this later
      const allDoctors = await this.prisma.doctor.findMany({
        include: {
          doctorSpecialties: true,
        },
      orderBy: { createdAt: 'desc' },
    });

      console.log(`👨‍⚕️ [DEBUG] Found ${allDoctors.length} total doctors from database`);

      // Enrich doctors with specialty details from specialty-service
      const enrichedDoctors = await Promise.all(allDoctors.map(async (doctor) => {
        try {
          return await this.enrichDoctorWithSpecialties(doctor);
        } catch (error) {
          console.error(`Error enriching doctor ${doctor.id} with specialties:`, error.message);
          return {
            ...doctor,
            specialties: [],
          };
        }
      }));

      // Check user service health first
      let isUserServiceHealthy = false;
      try {
        isUserServiceHealthy = await this.checkUserServiceHealth();
      } catch (error) {
        console.warn(`Error checking user service health: ${error.message}`);
        isUserServiceHealthy = false;
      }
      
      // Fetch user data for each doctor
      const doctorsWithUsers = await Promise.all(enrichedDoctors.map(async (doctor) => {
        let doctorWithUser;
        if (!isUserServiceHealthy) {
          const mockUserData = this.generateMockUserData(doctor.userId);
          doctorWithUser = {
            ...doctor,
            user: mockUserData
          };
        } else {
        try {
          const userData = await this.fetchUserData(doctor.userId);
            doctorWithUser = {
            ...doctor,
            user: userData
          };
        } catch (error) {
          // Return doctor with mock user data
          const mockUserData = this.generateMockUserData(doctor.userId);
            doctorWithUser = {
            ...doctor,
            user: mockUserData
          };
        }
        }
        
        // Extract specialty from specialties array for frontend compatibility
        // Use first active specialty name, or first specialty if none are active
        let specialtyName = 'General Practice';
        if (doctorWithUser.specialties && Array.isArray(doctorWithUser.specialties) && doctorWithUser.specialties.length > 0) {
          const activeSpecialty = doctorWithUser.specialties.find((s: any) => s.isActive !== false);
          specialtyName = activeSpecialty?.name || doctorWithUser.specialties[0]?.name || 'General Practice';
        } else if (doctorWithUser.specialty) {
          // Fallback to direct specialty field if it exists
          specialtyName = doctorWithUser.specialty;
        }
        
        // Add specialty field for frontend compatibility
        return {
          ...doctorWithUser,
          specialty: specialtyName
        };
      }));

      // Apply search filter if provided (search in name, specialty)
      let filteredDoctors = doctorsWithUsers;
      if (hasSearch) {
        const searchLower = searchQuery.toLowerCase();
        filteredDoctors = doctorsWithUsers.filter((doctor: any) => {
          // Search in doctor name (from user data)
          const firstName = doctor.user?.firstName?.toLowerCase() || '';
          const lastName = doctor.user?.lastName?.toLowerCase() || '';
          const fullName = `${firstName} ${lastName}`.trim();
          const nameMatch = fullName.includes(searchLower) || firstName.includes(searchLower) || lastName.includes(searchLower);
          
          // Search in specialty
          const specialtyMatch = doctor.specialty?.toLowerCase().includes(searchLower) || false;
          
          // Search in specialty names from specialties array
          const specialtiesMatch = doctor.specialties?.some((s: any) => 
            s.name?.toLowerCase().includes(searchLower)
          ) || false;
          
          return nameMatch || specialtyMatch || specialtiesMatch;
        });
        
        console.log('🔍 [DEBUG] Search filter applied:', {
          searchQuery,
          totalBefore: doctorsWithUsers.length,
          totalAfter: filteredDoctors.length
        });
      }

      // Apply pagination
      let paginatedDoctors = filteredDoctors;
      if (limit) {
        const skip = (page - 1) * limit;
        paginatedDoctors = filteredDoctors.slice(skip, skip + limit);
        console.log('📄 [DEBUG] Pagination applied:', {
          page,
          limit,
          skip,
          total: filteredDoctors.length,
          returned: paginatedDoctors.length
        });
      }
      
      return paginatedDoctors;
    } catch (error) {
      console.error('❌ [DEBUG] Error in findAll:', error);
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

      // Enrich doctor with specialty details from specialty-service
      let enrichedDoctor;
      try {
        enrichedDoctor = await this.enrichDoctorWithSpecialties(doctor);
      } catch (error) {
        console.error(`Error enriching doctor ${doctor.id} with specialties:`, error.message);
        enrichedDoctor = {
          ...doctor,
          specialties: [],
        };
      }
      
      // Check user service health first
      let isUserServiceHealthy = false;
      try {
        isUserServiceHealthy = await this.checkUserServiceHealth();
      } catch (error) {
        console.warn(`Error checking user service health: ${error.message}`);
        isUserServiceHealthy = false;
      }
      
      // Fetch user data
      if (!isUserServiceHealthy) {
        const mockUserData = this.generateMockUserData(doctor.userId);
        return {
          ...enrichedDoctor,
          user: mockUserData
        };
      }

      try {
        const userData = await this.fetchUserData(doctor.userId);
        const doctorWithUser = {
          ...enrichedDoctor,
          user: userData
        };
        
        // Extract specialty from specialties array for frontend compatibility
        let specialtyName = 'General Practice';
        if (doctorWithUser.specialties && Array.isArray(doctorWithUser.specialties) && doctorWithUser.specialties.length > 0) {
          const activeSpecialty = doctorWithUser.specialties.find((s: any) => s.isActive !== false);
          specialtyName = activeSpecialty?.name || doctorWithUser.specialties[0]?.name || 'General Practice';
        } else if (doctorWithUser.specialty) {
          specialtyName = doctorWithUser.specialty;
        }
        
        return {
          ...doctorWithUser,
          specialty: specialtyName
        };
      } catch (error) {
        // Return doctor with mock user data
        const mockUserData = this.generateMockUserData(doctor.userId);
        const doctorWithMockUser = {
          ...enrichedDoctor,
          user: mockUserData
        };
        
        // Extract specialty from specialties array
        let specialtyName = 'General Practice';
        if (doctorWithMockUser.specialties && Array.isArray(doctorWithMockUser.specialties) && doctorWithMockUser.specialties.length > 0) {
          const activeSpecialty = doctorWithMockUser.specialties.find((s: any) => s.isActive !== false);
          specialtyName = activeSpecialty?.name || doctorWithMockUser.specialties[0]?.name || 'General Practice';
        } else if (doctorWithMockUser.specialty) {
          specialtyName = doctorWithMockUser.specialty;
        }
        
        return {
          ...doctorWithMockUser,
          specialty: specialtyName
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto) {
    try {
      console.log('📝 [SERVICE] Starting doctor update:', { id, updateDoctorDto });
      
      const { specialtyIds, ...doctorData } = updateDoctorDto;
      
      // Clean doctorData: convert empty strings to null for optional fields
      const cleanedDoctorData: any = {};
      
      // Only include fields that are actually provided (not undefined)
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
      
      console.log('📝 [SERVICE] Cleaned doctor data:', cleanedDoctorData);
      console.log('📝 [SERVICE] Specialty IDs:', specialtyIds);
      
      // Check if there's anything to update
      const hasDataToUpdate = Object.keys(cleanedDoctorData).length > 0;
      const hasSpecialtyIds = specialtyIds !== undefined;
      
      if (!hasDataToUpdate && !hasSpecialtyIds) {
        console.warn('⚠️ [SERVICE] No data provided to update');
        // Return current doctor data
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
        
        // Validate specialtyIds format
        if (specialtyIds.some(id => !id || typeof id !== 'string')) {
          throw new Error('All specialtyIds must be valid strings');
        }
        
        // Verify specialties exist in specialty-service (only if we have specialty IDs)
        if (specialtyIds.length > 0) {
          console.log('🔍 [SERVICE] Verifying specialties exist:', specialtyIds);
          try {
            const allExist = await this.specialtyServiceClient.verifySpecialtiesExist(specialtyIds);
            if (!allExist) {
              console.error('❌ [SERVICE] One or more specialties not found');
              throw new NotFoundException('One or more specialties not found in specialty-service');
            }
            console.log('✅ [SERVICE] All specialties verified');
          } catch (error) {
            console.error('❌ [SERVICE] Error verifying specialties:', error);
            // If it's already a NotFoundException, re-throw it
            if (error instanceof NotFoundException) {
              throw error;
            }
            // If specialty-service is down, log warning but continue (graceful degradation)
            console.warn('⚠️ [SERVICE] Specialty service unavailable, continuing without verification');
            // Don't throw - allow update to proceed if specialty-service is down
          }
        }
        
        // Update doctor with specialty relations
        console.log('💾 [SERVICE] Updating doctor with specialties in database...');
        const updateData: any = {};
        
        // Handle specialty updates
        if (specialtyIds.length > 0) {
          updateData.doctorSpecialties = {
            deleteMany: {}, // Remove all existing specialties
            create: specialtyIds.map(specialtyId => ({
              specialtyId,
            })),
          };
        } else {
          // Empty array means remove all specialties
          updateData.doctorSpecialties = {
            deleteMany: {},
          };
        }
        
        // Only add other fields if there's data to update
        if (hasDataToUpdate) {
          Object.assign(updateData, cleanedDoctorData);
        }
        
        console.log('💾 [SERVICE] Update data prepared:', JSON.stringify(updateData, null, 2));
        
        // Validate that we have something to update
        if (Object.keys(updateData).length === 0) {
          console.warn('⚠️ [SERVICE] No data to update, returning current doctor');
          const currentDoctor = await this.prisma.doctor.findUnique({
            where: { id },
            include: { doctorSpecialties: true },
          });
          if (!currentDoctor) {
            throw new NotFoundException('Doctor not found');
          }
          return this.enrichDoctorWithSpecialties(currentDoctor);
        }
        
        try {
          const updatedDoctor = await this.prisma.doctor.update({
            where: { id },
            data: updateData,
            include: {
              doctorSpecialties: true,
            },
          });
        
          console.log('✅ [SERVICE] Doctor updated successfully in database:', updatedDoctor.id);
          
          // Return doctor with enriched specialties
          try {
            const enriched = await this.enrichDoctorWithSpecialties(updatedDoctor);
            console.log('✅ [SERVICE] Doctor enriched with specialties');
            return enriched;
          } catch (enrichError) {
            console.error('⚠️ [SERVICE] Error enriching doctor, returning without enrichment:', enrichError);
            // Return doctor without enrichment if enrichment fails
            return {
              ...updatedDoctor,
              specialties: [],
            };
          }
        } catch (prismaError) {
          console.error('❌ [SERVICE] Prisma error during update:', prismaError);
          console.error('❌ [SERVICE] Prisma error details:', {
            code: prismaError?.code,
            meta: prismaError?.meta,
            message: prismaError?.message,
          });
          throw prismaError;
        }
      } else {
        // No specialtyIds provided, just update other fields
        if (!hasDataToUpdate) {
          console.warn('⚠️ [SERVICE] No data to update, returning current doctor');
          const currentDoctor = await this.prisma.doctor.findUnique({
            where: { id },
            include: { doctorSpecialties: true },
          });
          if (!currentDoctor) {
            throw new NotFoundException('Doctor not found');
          }
          return this.enrichDoctorWithSpecialties(currentDoctor);
        }
        
        console.log('💾 [SERVICE] Updating doctor without specialty changes...');
        const updatedDoctor = await this.prisma.doctor.update({
          where: { id },
          data: cleanedDoctorData,
          include: {
            doctorSpecialties: true,
          },
        });
        
        console.log('✅ [SERVICE] Doctor updated successfully in database:', updatedDoctor.id);
        
        // Return doctor with enriched specialties
        try {
          const enriched = await this.enrichDoctorWithSpecialties(updatedDoctor);
          console.log('✅ [SERVICE] Doctor enriched with specialties');
          return enriched;
        } catch (enrichError) {
          console.error('⚠️ [SERVICE] Error enriching doctor, returning without enrichment:', enrichError);
          // Return doctor without enrichment if enrichment fails
          return {
            ...updatedDoctor,
            specialties: [],
          };
        }
      }
    } catch (error) {
      console.error('❌ [SERVICE] Error updating doctor:', error);
      console.error('❌ [SERVICE] Error details:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        name: error?.name,
      });
      
      if (error.code === 'P2025') {
        throw new NotFoundException('Doctor not found');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Doctor with this license number already exists');
      }
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      
      // Re-throw with more context
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update doctor: ${errorMessage}`);
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
      const { workingDays, startTime, endTime, consultationFee } = assignHospitalDto;
      
      // Check if doctor exists
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
        // Update existing assignment instead of throwing error
        const updatedAssignment = await this.prisma.hospitalDoctor.update({
          where: {
            doctorId_hospitalId: {
              doctorId,
              hospitalId,
            },
          },
          data: {
            workingDays: workingDays ? JSON.stringify(workingDays) : null,
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
          workingDays: workingDays ? JSON.stringify(workingDays) : null,
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
      console.error('❌ [SERVICE] Error in assignToHospital:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      // Log the full error for debugging
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('❌ [SERVICE] Full error details:', { errorMessage, errorStack, error });
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
    // Note: Role is not stored in doctor-service schema (it's derived from doctor's specialty)
    // Role updates should be handled by hospital-service if needed
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
      
      // Parse workingDays JSON for each assignment
      return assignments.map(assignment => ({
        ...assignment,
        workingDays: assignment.workingDays ? JSON.parse(assignment.workingDays) : null,
      }));
    } catch (error) {
      throw error;
    }
  }

  async getHospitalDoctors(hospitalId: string) {
    try {
      const assignments = await this.prisma.hospitalDoctor.findMany({
        where: { hospitalId },
        include: {
          doctor: true,
        },
      });
      
      return assignments;
    } catch (error) {
      throw error;
    }
  }

  async addSpecialty(doctorId: string, specialtyId: string) {
    try {
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
      
      // Fetch specialty details from specialty-service
      const specialtyIds = doctorSpecialties.map(ds => ds.specialtyId);
      const specialties = await this.specialtyServiceClient.getSpecialtiesByIds(specialtyIds);
      
      return doctorSpecialties.map(ds => {
        const specialty = specialties.find(s => s.id === ds.specialtyId);
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
      // Fetch all specialties from specialty-service
      return await this.specialtyServiceClient.getSpecialties();
    } catch (error) {
      throw error;
    }
  }

  private async checkUserServiceHealth(): Promise<boolean> {
    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://31.97.58.62:3001';
      const healthUrl = `${userServiceUrl}/health`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(healthUrl, { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);
      const isHealthy = response.ok;
      return isHealthy;
    } catch (error) {
      return false;
    }
  }

  private generateMockUserData(userId: string): any {
    // Generate realistic mock user data for development
    const firstNames = ['Dr. Sarah', 'Dr. Michael', 'Dr. Emily', 'Dr. James', 'Dr. Lisa', 'Dr. David', 'Dr. Maria', 'Dr. Robert', 'Dr. Jennifer', 'Dr. Christopher', 'Dr. Amanda', 'Dr. Daniel', 'Dr. Jessica', 'Dr. Matthew', 'Dr. Ashley', 'Dr. Andrew', 'Dr. Nicole', 'Dr. Kevin', 'Dr. Rachel', 'Dr. Brian', 'Dr. Stephanie', 'Dr. Ryan', 'Dr. Lauren', 'Dr. Justin', 'Dr. Megan', 'Dr. Tyler', 'Dr. Samantha', 'Dr. Nathan', 'Dr. Brittany', 'Dr. Jordan'];
    const lastNames = ['Johnson', 'Smith', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins'];
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hospital.com', 'clinic.org', 'medical.net', 'healthcare.com', 'doctors.org'];
    
    // Create a more complex hash using multiple parts of the userId
    let hash1 = 0;
    let hash2 = 0;
    let hash3 = 0;
    
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      if (i % 3 === 0) hash1 += char;
      else if (i % 3 === 1) hash2 += char;
      else hash3 += char;
    }
    
    // Add some additional variation using the userId length and position
    hash1 += userId.length * 7;
    hash2 += userId.length * 11;
    hash3 += userId.length * 13;
    
    const firstName = firstNames[Math.abs(hash1) % firstNames.length];
    const lastName = lastNames[Math.abs(hash2) % lastNames.length];
    const domain = domains[Math.abs(hash3) % domains.length];
    
    // Create unique email by using more of the userId
    const emailPrefix = `${firstName.toLowerCase().replace('dr. ', '')}.${lastName.toLowerCase()}.${userId.substring(0, 6)}`;
    const email = `${emailPrefix}@${domain}`;
    
    // Generate unique phone number based on userId
    const phoneHash = Math.abs(hash1 + hash2 + hash3) % 9000 + 1000;
    
    return {
      id: userId,
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: `+1-555-${phoneHash}`
    };
  }

  private async fetchUserData(userId: string): Promise<any> {
    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://31.97.58.62:3001';
      const fetchUrl = `${userServiceUrl}/api/v1/users/${userId}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const userData = await response.json();
      return userData;
    } catch (error) {
      // Check if it's a network error
      if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
        throw new Error('User service is not available');
      }
      
      throw error;
    }
  }

  private async getCachedSpecialtiesByIds(specialtyIds: string[]): Promise<any[]> {
    if (!Array.isArray(specialtyIds) || specialtyIds.length === 0) return [];
    
    try {
      // Check cache first
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
      
      // Fetch missing specialties from specialty-service
      let fetched: any[] = [];
      if (missingIds.length > 0 || isExpired) {
        const toFetch = isExpired ? specialtyIds : missingIds;
        try {
          fetched = await this.specialtyServiceClient.getSpecialtiesByIds(toFetch);
          
          // Update cache
          const now = Date.now();
          if (isExpired) this.specialtiesCache.clear();
          for (const s of fetched) {
            this.specialtiesCache.set(s.id, s);
          }
          this.lastCacheUpdate = now;
        } catch (error) {
          console.warn(`Failed to fetch specialties from specialty-service: ${error instanceof Error ? error.message : String(error)}`);
          return resultsFromCache;
        }
      }
      
      // Return in requested order
      const mergedMap = new Map<string, any>();
      for (const s of resultsFromCache) mergedMap.set(s.id, s);
      for (const s of fetched) mergedMap.set(s.id, s);
      return specialtyIds.map(id => mergedMap.get(id)).filter(Boolean);
    } catch (error) {
      console.error(`Error in getCachedSpecialtiesByIds: ${error instanceof Error ? error.message : String(error)}`);
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

      // Fetch specialty details from specialty-service
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
      console.error(`Error enriching doctor with specialties: ${error instanceof Error ? error.message : String(error)}`);
      return {
        ...doctor,
        specialties: [],
      };
    }
  }
}