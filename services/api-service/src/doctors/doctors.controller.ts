import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { AssignHospitalDto } from './dto/assign-hospital.dto';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  create(@Body() createDoctorDto: CreateDoctorDto) {
    return this.doctorsService.create(createDoctorDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const decodedSearch = search ? decodeURIComponent(search).trim() : undefined;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    
    return this.doctorsService.findAll({
      page: pageNum,
      limit: limitNum,
      search: decodedSearch || undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
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
    @Body() assignHospitalDto: AssignHospitalDto,
  ) {
    return this.doctorsService.assignToHospital(doctorId, hospitalId, assignHospitalDto);
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
  @Get('specialties/all')
  getAllSpecialties() {
    return this.doctorsService.getAllSpecialties();
  }

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

