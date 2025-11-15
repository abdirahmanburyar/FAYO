import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Controller('doctors')
@UseGuards(ThrottlerGuard)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  create(@Body() createDoctorDto: CreateDoctorDto) {
    console.log('🚀 [CONTROLLER] Doctor creation request received');
    console.log('📦 [CONTROLLER] Request body:', createDoctorDto);
    return this.doctorsService.create(createDoctorDto);
  }

  @Get()
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
    return this.doctorsService.update(id, updateDoctorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.doctorsService.remove(id);
  }

  // Hospital assignment endpoints
  @Post(':id/hospitals/:hospitalId')
  assignToHospital(
    @Param('id') doctorId: string,
    @Param('hospitalId') hospitalId: string,
    @Body('role') role?: string,
  ) {
    return this.doctorsService.assignToHospital(doctorId, hospitalId, role);
  }

  @Delete(':id/hospitals/:hospitalId')
  removeFromHospital(
    @Param('id') doctorId: string,
    @Param('hospitalId') hospitalId: string,
  ) {
    return this.doctorsService.removeFromHospital(doctorId, hospitalId);
  }

  @Patch(':id/hospitals/:hospitalId/role')
  updateHospitalRole(
    @Param('id') doctorId: string,
    @Param('hospitalId') hospitalId: string,
    @Body('role') role: string,
  ) {
    return this.doctorsService.updateHospitalRole(doctorId, hospitalId, role);
  }

  @Get(':id/hospitals')
  getDoctorHospitals(@Param('id') doctorId: string) {
    return this.doctorsService.getDoctorHospitals(doctorId);
  }

  @Get('hospitals/:hospitalId')
  getHospitalDoctors(@Param('hospitalId') hospitalId: string) {
    return this.doctorsService.getHospitalDoctors(hospitalId);
  }

  // Specialty management endpoints
  @Post(':id/specialties/:specialtyId')
  addSpecialty(
    @Param('id') doctorId: string,
    @Param('specialtyId') specialtyId: string,
  ) {
    return this.doctorsService.addSpecialty(doctorId, specialtyId);
  }

  @Delete(':id/specialties/:specialtyId')
  removeSpecialty(
    @Param('id') doctorId: string,
    @Param('specialtyId') specialtyId: string,
  ) {
    return this.doctorsService.removeSpecialty(doctorId, specialtyId);
  }

  @Get(':id/specialties')
  getDoctorSpecialties(@Param('id') doctorId: string) {
    return this.doctorsService.getDoctorSpecialties(doctorId);
  }
}
