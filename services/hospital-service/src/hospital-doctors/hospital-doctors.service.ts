import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { AssignDoctorDto } from './dto/assign-doctor.dto';
import { UpdateDoctorRoleDto } from './dto/update-doctor-role.dto';

@Injectable()
export class HospitalDoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHospitalDoctors(hospitalId: string) {
    try {
      console.log('🏥 [DEBUG] getHospitalDoctors called for hospital:', hospitalId);
      
      // Check if hospital exists
      const hospital = await this.prisma.hospital.findUnique({
        where: { id: hospitalId },
      });

      if (!hospital) {
        throw new NotFoundException(`Hospital with ID ${hospitalId} not found`);
      }

      // Get all doctors for this hospital
      // Explicitly select only fields that exist in the schema to avoid schema mismatch errors
      const hospitalDoctors = await this.prisma.hospitalDoctor.findMany({
        where: { hospitalId },
        include: {
          doctor: {
            select: {
              id: true,
              userId: true,
              specialty: true,
              licenseNumber: true,
              experience: true,
              isVerified: true,
              isAvailable: true,
              consultationFee: true,
              bio: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      });

      console.log('📊 [DEBUG] Found hospital doctors:', hospitalDoctors.length);
      return hospitalDoctors;
    } catch (error) {
      console.error('❌ [DEBUG] Error in getHospitalDoctors:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch hospital doctors: ${error.message}`);
    }
  }

  async assignDoctor(hospitalId: string, assignDoctorDto: AssignDoctorDto) {
    try {
      console.log('🏥 [DEBUG] assignDoctor called with:', { hospitalId, ...assignDoctorDto });
      
      // Check if hospital exists
      const hospital = await this.prisma.hospital.findUnique({
        where: { id: hospitalId },
      });

      if (!hospital) {
        console.log('❌ [DEBUG] Hospital not found:', hospitalId);
        throw new NotFoundException(`Hospital with ID ${hospitalId} not found`);
      }
      console.log('✅ [DEBUG] Hospital found:', hospital.name);

      // Check if doctor already exists for this hospital
      const existingDoctor = await this.prisma.hospitalDoctor.findUnique({
        where: {
          doctorId_hospitalId: {
            doctorId: assignDoctorDto.doctorId,
            hospitalId,
          },
        },
      });

      if (existingDoctor) {
        console.log('❌ [DEBUG] Doctor already exists for this hospital');
        throw new ConflictException('Doctor already exists for this hospital');
      }
      console.log('✅ [DEBUG] Doctor does not exist, proceeding to assign');

      console.log('💾 [DEBUG] Creating hospital doctor with:', { hospitalId, ...assignDoctorDto });

      const hospitalDoctor = await this.prisma.hospitalDoctor.create({
        data: {
          hospitalId,
          doctorId: assignDoctorDto.doctorId,
          role: assignDoctorDto.role || 'CONSULTANT',
        },
        include: {
          doctor: {
            select: {
              id: true,
              userId: true,
              specialty: true,
              licenseNumber: true,
              experience: true,
              isVerified: true,
              isAvailable: true,
              consultationFee: true,
              bio: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      console.log('✅ [DEBUG] Hospital doctor created successfully:', hospitalDoctor);
      return hospitalDoctor;
    } catch (error) {
      console.error('❌ [DEBUG] Error in assignDoctor:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to assign doctor: ${error.message}`);
    }
  }

  async removeDoctor(hospitalId: string, doctorId: string) {
    try {
      const hospitalDoctor = await this.prisma.hospitalDoctor.findUnique({
        where: {
          doctorId_hospitalId: {
            doctorId,
            hospitalId,
          },
        },
      });

      if (!hospitalDoctor) {
        throw new NotFoundException('Doctor not found for this hospital');
      }

      await this.prisma.hospitalDoctor.delete({
        where: {
          doctorId_hospitalId: {
            doctorId,
            hospitalId,
          },
        },
      });

      return { message: 'Doctor removed successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to remove doctor: ${error.message}`);
    }
  }

  async updateDoctorRole(hospitalId: string, doctorId: string, updateRoleDto: UpdateDoctorRoleDto) {
    try {
      const hospitalDoctor = await this.prisma.hospitalDoctor.findUnique({
        where: {
          doctorId_hospitalId: {
            doctorId,
            hospitalId,
          },
        },
      });

      if (!hospitalDoctor) {
        throw new NotFoundException('Doctor not found for this hospital');
      }

      return await this.prisma.hospitalDoctor.update({
        where: {
          doctorId_hospitalId: {
            doctorId,
            hospitalId,
          },
        },
        data: { role: updateRoleDto.role },
        include: {
          doctor: {
            select: {
              id: true,
              userId: true,
              specialty: true,
              licenseNumber: true,
              experience: true,
              isVerified: true,
              isAvailable: true,
              consultationFee: true,
              bio: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update doctor role: ${error.message}`);
    }
  }

  async getDoctorHospitals(doctorId: string) {
    try {
      return await this.prisma.hospitalDoctor.findMany({
        where: { doctorId },
        include: {
          hospital: true,
        },
        orderBy: { joinedAt: 'desc' },
      });
    } catch (error) {
      throw new Error(`Failed to fetch doctor hospitals: ${error.message}`);
    }
  }
}
