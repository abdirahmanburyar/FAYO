import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { HospitalDoctorsService } from './hospital-doctors.service';
import { AssignDoctorDto } from './dto/assign-doctor.dto';
import { UpdateDoctorRoleDto } from './dto/update-doctor-role.dto';

@Controller('hospitals')
@UseGuards(ThrottlerGuard)
export class HospitalDoctorsController {
  constructor(private readonly hospitalDoctorsService: HospitalDoctorsService) {}

  @Get(':id/doctors')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  getHospitalDoctors(@Param('id') hospitalId: string) {
    return this.hospitalDoctorsService.getHospitalDoctors(hospitalId);
  }

  @Post(':id/doctors')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  assignDoctor(
    @Param('id') hospitalId: string,
    @Body() assignDoctorDto: AssignDoctorDto,
  ) {
    return this.hospitalDoctorsService.assignDoctor(hospitalId, assignDoctorDto);
  }

  @Delete(':id/doctors/:doctorId')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  removeDoctor(
    @Param('id') hospitalId: string,
    @Param('doctorId') doctorId: string,
  ) {
    return this.hospitalDoctorsService.removeDoctor(hospitalId, doctorId);
  }

  @Patch(':id/doctors/:doctorId/role')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  updateDoctorRole(
    @Param('id') hospitalId: string,
    @Param('doctorId') doctorId: string,
    @Body() updateRoleDto: UpdateDoctorRoleDto,
  ) {
    return this.hospitalDoctorsService.updateDoctorRole(hospitalId, doctorId, updateRoleDto);
  }

  @Get('doctors/:doctorId/hospitals')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  getDoctorHospitals(@Param('doctorId') doctorId: string) {
    return this.hospitalDoctorsService.getDoctorHospitals(doctorId);
  }
}
