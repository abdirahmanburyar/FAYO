import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { HospitalsService } from './hospitals.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { AddDoctorDto } from './dto/add-doctor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('hospitals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Public() // Allow public access for creating hospitals
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  create(@Body() createHospitalDto: CreateHospitalDto) {
    // Log the action
    return this.hospitalsService.create(createHospitalDto);
  }

  @Get()
  @Public() // Allow public access for listing hospitals
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 requests per minute
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    try {
      // Decode search query (handles URL encoding like + for spaces)
      const decodedSearch = search ? decodeURIComponent(search).trim() : undefined;
      const hasSearch = decodedSearch && decodedSearch.length > 0;
      
      // Parse page - if search is provided and page is not explicitly set, default to 1
      // Otherwise, use the provided page (allows pagination of search results)
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : undefined;
      
      console.log('📥 [CONTROLLER] Received search query:', { 
        original: search, 
        decoded: decodedSearch,
        hasSearch,
        page: pageNum 
      });
      
      return await this.hospitalsService.findAll({
        page: pageNum,
        limit: limitNum,
        search: decodedSearch || undefined,
      });
    } catch (error) {
      console.error('❌ [CONTROLLER] Error in findAll:', error);
      throw error;
    }
  }

  @Get('stats')
  @Roles('ADMIN', 'HOSPITAL_MANAGER')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  getStats() {
    return this.hospitalsService.getHospitalStats();
  }

  @Get('by-user/:userId')
  @Public() // Allow public access for finding hospital by user ID
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  findByUserId(@Param('userId') userId: string) {
    return this.hospitalsService.findByUserId(userId);
  }

  @Get(':id')
  @Public() // Allow public access for individual hospital details
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  findOne(@Param('id') id: string) {
    return this.hospitalsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'HOSPITAL_MANAGER')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  update(@Param('id') id: string, @Body() updateHospitalDto: UpdateHospitalDto, @Request() req) {
    // Log the action
    return this.hospitalsService.update(id, updateHospitalDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN') // Only admins can delete hospitals
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  remove(@Param('id') id: string, @Request() req) {
    // Log the action
    return this.hospitalsService.remove(id);
  }

  // Hospital Specialties Management
  @Post(':id/specialties')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'HOSPITAL_MANAGER')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  addSpecialty(@Param('id') hospitalId: string, @Body('specialtyId') specialtyId: string, @Request() req) {
    return this.hospitalsService.addSpecialty(hospitalId, specialtyId);
  }

  @Delete(':id/specialties/:specialtyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'HOSPITAL_MANAGER')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  removeSpecialty(@Param('id') hospitalId: string, @Param('specialtyId') specialtyId: string, @Request() req) {
    return this.hospitalsService.removeSpecialty(hospitalId, specialtyId);
  }


  // Hospital Services Management
  @Get(':id/services')
  @Public() // Allow public access for fetching hospital services
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  getServices(@Param('id') hospitalId: string) {
    return this.hospitalsService.getServices(hospitalId);
  }

  @Post(':id/services')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'HOSPITAL_MANAGER')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  addService(@Param('id') hospitalId: string, @Body('serviceId') serviceId: string, @Request() req) {
    return this.hospitalsService.addService(hospitalId, serviceId);
  }

  @Delete(':id/services/:serviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'HOSPITAL_MANAGER')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  removeService(@Param('id') hospitalId: string, @Param('serviceId') serviceId: string, @Request() req) {
    return this.hospitalsService.removeService(hospitalId, serviceId);
  }

  // Hospital Doctors Management
  // IMPORTANT: POST routes must come before literal paths to avoid route conflicts
  // NestJS matches routes in order, and parameterized routes can conflict with literal paths
  @Post(':id/doctors/:doctorId')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'HOSPITAL_MANAGER')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  addDoctor(
    @Param('id') hospitalId: string,
    @Param('doctorId') doctorId: string,
    @Body() addDoctorDto: AddDoctorDto,
    @Request() req
  ) {
    console.log('🏥 [CONTROLLER] addDoctor called:', { hospitalId, doctorId, addDoctorDto, user: req.user });
    return this.hospitalsService.addDoctor(hospitalId, doctorId, addDoctorDto);
  }

  @Patch(':id/doctors/:doctorId')
  @Roles('ADMIN', 'HOSPITAL_MANAGER')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  updateDoctor(
    @Param('id') hospitalId: string,
    @Param('doctorId') doctorId: string,
    @Body() updateDoctorDto: AddDoctorDto,
    @Request() req
  ) {
    return this.hospitalsService.updateDoctor(hospitalId, doctorId, updateDoctorDto);
  }

  @Delete(':id/doctors/:doctorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'HOSPITAL_MANAGER')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  removeDoctor(
    @Param('id') hospitalId: string,
    @Param('doctorId') doctorId: string,
    @Request() req
  ) {
    return this.hospitalsService.removeDoctor(hospitalId, doctorId);
  }

  // GET routes for doctors - must come after POST/PATCH/DELETE to avoid conflicts
  // Note: The literal path 'doctors/:doctorId/hospitals' must come before ':id/doctors'
  @Get('doctors/:doctorId/hospitals')
  @Public() // Allow public access for fetching doctor's hospitals
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  getHospitalsForDoctor(@Param('doctorId') doctorId: string) {
    return this.hospitalsService.getHospitalsForDoctor(doctorId);
  }

  @Get(':id/doctors')
  @Public() // Allow public access for fetching hospital doctors
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  getDoctors(@Param('id') hospitalId: string) {
    return this.hospitalsService.getDoctors(hospitalId);
  }

  @Post('services/update-names')
  updateServiceNames() {
    return this.hospitalsService.updateServiceNames();
  }

}
