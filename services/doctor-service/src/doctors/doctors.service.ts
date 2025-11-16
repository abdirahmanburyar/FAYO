import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { SharedServiceClient } from '../common/message-queue/shared-service.client';

@Injectable()
export class DoctorsService {
  private specialtiesCache: Map<string, any> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate: number = 0;

  constructor(
    private prisma: PrismaService,
    private sharedServiceClient: SharedServiceClient,
  ) {}

  // ===== HTTP helpers for shared-service (preferred for read paths) =====
  private async fetchSpecialtiesByIdsHttp(specialtyIds: string[]): Promise<any[]> {
    if (!Array.isArray(specialtyIds) || specialtyIds.length === 0) {
      return [];
    }
    const baseUrl = process.env.SHARED_SERVICE_URL || 'http://localhost:3004';
    // Prefer bulk ids query if supported; otherwise fetch all and filter
    const urlWithIds = `${baseUrl}/api/v1/specialties?ids=${encodeURIComponent(specialtyIds.join(','))}`;
    const allUrl = `${baseUrl}/api/v1/specialties`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    try {
      let response = await fetch(urlWithIds, { method: 'GET', headers: { 'Content-Type': 'application/json' }, signal: controller.signal });
      if (!response.ok) {
        // Fallback to fetching all then filter client-side
        response = await fetch(allUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' }, signal: controller.signal });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch specialties: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const allSpecs = await response.json();
        return (Array.isArray(allSpecs) ? allSpecs : []).filter((s: any) => specialtyIds.includes(s.id));
      }
      return await response.json();
    } catch (error) {
      // If fetch fails (network error, timeout, etc.), return empty array
      console.warn(`Failed to fetch specialties from shared-service: ${error.message}`);
      return [];
    } finally {
      clearTimeout(timeoutId);
    }
  }

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
      
      // Verify specialties exist in shared-service
      await this.verifySpecialtiesExist(specialtyIds);
      
      const doctor = await this.prisma.doctor.create({
        data: {
          ...doctorData,
          doctorSpecialties: {
            create: specialtyIds.map(specialtyId => ({
              specialtyId,
            })),
          },
        },
      });

      // Fetch specialty details from shared-service
      const enrichedDoctor = await this.enrichDoctorWithSpecialties(doctor);
      
      return enrichedDoctor;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Doctor with this license number already exists');
      }
      throw error;
    }
  }

  async findAll() {
    try {
      const doctors = await this.prisma.doctor.findMany({
        include: {
          doctorSpecialties: true,
        },
      orderBy: { createdAt: 'desc' },
    });

      // Enrich each doctor with specialty details from shared-service
      const enrichedDoctors = await Promise.all(doctors.map(async (doctor) => {
        try {
          return await this.enrichDoctorWithSpecialties(doctor);
        } catch (error) {
          // If enrichment fails, return doctor without specialty details
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
        if (!isUserServiceHealthy) {
          const mockUserData = this.generateMockUserData(doctor.userId);
          return {
            ...doctor,
            user: mockUserData
          };
        }

        try {
          const userData = await this.fetchUserData(doctor.userId);
          return {
            ...doctor,
            user: userData
          };
        } catch (error) {
          // Return doctor with mock user data
          const mockUserData = this.generateMockUserData(doctor.userId);
          return {
            ...doctor,
            user: mockUserData
          };
        }
      }));
      
      return doctorsWithUsers;
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

      // Enrich doctor with specialty details from shared-service
      let enrichedDoctor;
      try {
        enrichedDoctor = await this.enrichDoctorWithSpecialties(doctor);
      } catch (error) {
        // If enrichment fails, return doctor without specialty details
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
        return doctorWithUser;
      } catch (error) {
        // Return doctor with mock user data
        const mockUserData = this.generateMockUserData(doctor.userId);
        return {
          ...enrichedDoctor,
          user: mockUserData
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto) {
    try {
      const updatedDoctor = await this.prisma.doctor.update({
        where: { id },
        data: updateDoctorDto,
        include: {
          doctorSpecialties: true,
        },
      });
      
      return updatedDoctor;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Doctor not found');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Doctor with this license number already exists');
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

  async assignToHospital(doctorId: string, hospitalId: string, role: string = 'CONSULTANT') {
    try {
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
        throw new ConflictException('Doctor is already assigned to this hospital');
      }

      // Create hospital assignment
      const assignment = await this.prisma.hospitalDoctor.create({
        data: {
          doctorId,
          hospitalId,
          role,
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
    try {
      const updatedAssignment = await this.prisma.hospitalDoctor.update({
        where: {
          doctorId_hospitalId: {
            doctorId,
            hospitalId,
          },
        },
        data: { role },
      });
      
      return updatedAssignment;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Doctor assignment not found');
      }
      throw error;
    }
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
      const specialties = await this.prisma.doctorSpecialty.findMany({
        where: { doctorId },
      });
      
      return specialties;
    } catch (error) {
      throw error;
    }
  }

  private async checkUserServiceHealth(): Promise<boolean> {
    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
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
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
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

  private async getCachedSpecialties(): Promise<any[]> {
    const now = Date.now();
    
    // Check if cache is expired or empty
    if (this.specialtiesCache.size === 0 || (now - this.lastCacheUpdate) > this.cacheExpiry) {
      try {
        // Use HTTP to refresh cache for read path
        const specialties = await this.fetchSpecialtiesByIdsHttp([]).catch(async () => {
          // If bulk endpoint doesn't support empty ids, fetch all
          const baseUrl = process.env.SHARED_SERVICE_URL || 'http://localhost:3004';
          const resp = await fetch(`${baseUrl}/api/v1/specialties`);
          return await resp.json();
        });
        this.specialtiesCache.clear();
        
        // Cache specialties by ID
        specialties.forEach(specialty => {
          this.specialtiesCache.set(specialty.id, specialty);
        });
        
        this.lastCacheUpdate = now;
        return specialties;
      } catch (error) {
        // If fetch fails and we have cached data, return it
        if (this.specialtiesCache.size > 0) {
          return Array.from(this.specialtiesCache.values());
        }
        throw error;
      }
    }
    
    return Array.from(this.specialtiesCache.values());
  }

  private async getCachedSpecialtiesByIds(specialtyIds: string[]): Promise<any[]> {
    if (!Array.isArray(specialtyIds) || specialtyIds.length === 0) return [];
    
    try {
      // 1) Serve from cache if present
      const cachedNow = Date.now();
      const isExpired = (cachedNow - this.lastCacheUpdate) > this.cacheExpiry;
      const resultsFromCache: any[] = [];
      const missingIds: string[] = [];
      for (const id of specialtyIds) {
        const cached = !isExpired ? this.specialtiesCache.get(id) : undefined;
        if (cached) resultsFromCache.push(cached); else missingIds.push(id);
      }
      
      // 2) Fetch missing via HTTP, then update cache
      let fetched: any[] = [];
      if (missingIds.length > 0 || isExpired) {
        const toFetch = isExpired ? specialtyIds : missingIds;
        try {
          fetched = await this.fetchSpecialtiesByIdsHttp(toFetch);
          const now = Date.now();
          if (isExpired) this.specialtiesCache.clear();
          for (const s of fetched) this.specialtiesCache.set(s.id, s);
          this.lastCacheUpdate = now;
        } catch (error) {
          // If HTTP fetch fails, return what we have from cache
          console.warn(`Failed to fetch specialties from shared-service: ${error.message}`);
          // Return cached results if available, otherwise empty array
          return resultsFromCache;
        }
      }
      
      // 3) Return in requested order
      const mergedMap = new Map<string, any>();
      for (const s of resultsFromCache) mergedMap.set(s.id, s);
      for (const s of fetched) mergedMap.set(s.id, s);
      return specialtyIds.map(id => mergedMap.get(id)).filter(Boolean);
    } catch (error) {
      // If everything fails, return empty array
      console.error(`Error in getCachedSpecialtiesByIds: ${error.message}`);
      return [];
    }
  }

  private async verifySpecialtiesExist(specialtyIds: string[]): Promise<void> {
    try {
      // Fetch via HTTP + cache helper
      const specialties = await this.getCachedSpecialtiesByIds(specialtyIds);
      const foundIds = new Set(specialties.map(s => s.id));
      const missing = specialtyIds.filter(id => !foundIds.has(id));
      if (missing.length > 0) {
        throw new NotFoundException(`One or more specialties not found. Missing: ${missing.join(', ')}`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to verify specialties: ${error.message}`);
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

      // Get the exact specialties by IDs via HTTP+cache
      const specialtyIds = doctor.doctorSpecialties.map(ds => ds.specialtyId);
      const specialties = await this.getCachedSpecialtiesByIds(specialtyIds);
      const specialtyMap = new Map(specialties.map((s: any) => [s.id, s]));
      
      const enrichedSpecialties = doctor.doctorSpecialties.map(ds => {
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