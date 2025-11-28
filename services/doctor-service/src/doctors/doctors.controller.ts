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
    console.log('🚀 [CONTROLLER] Doctor creation request received');
    console.log('📦 [CONTROLLER] Request body:', createDoctorDto);
    return this.doctorsService.create(createDoctorDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    try {
      // Decode search query (handles URL encoding like + for spaces)
      const decodedSearch = search ? decodeURIComponent(search).trim() : undefined;
      const hasSearch = decodedSearch && decodedSearch.length > 0;
      
      // Parse page - if search is provided and page is not explicitly set, default to 1
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : undefined;
      
      console.log('📥 [CONTROLLER] Received doctor search query:', { 
        original: search, 
        decoded: decodedSearch,
        hasSearch,
        page: pageNum,
        limit: limitNum
      });
      
      return this.doctorsService.findAll({
        page: pageNum,
        limit: limitNum,
        search: decodedSearch || undefined,
      });
    } catch (error) {
      console.error('❌ [CONTROLLER] Error in findAll:', error);
      throw error;
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
    try {
      console.log('📝 [CONTROLLER] Doctor update request received:', { id, updateDoctorDto });
      const result = await this.doctorsService.update(id, updateDoctorDto);
      console.log('✅ [CONTROLLER] Doctor update successful');
      return result;
    } catch (error) {
      console.error('❌ [CONTROLLER] Error in update endpoint:', error);
      console.error('❌ [CONTROLLER] Error details:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        name: error?.name,
      });
      throw error;
    }
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
    console.log('📥 [CONTROLLER] Assign hospital request:', { doctorId, hospitalId, assignHospitalDto });
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
  // IMPORTANT: This route must come before @Get(':id/specialties') to avoid route conflicts
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
