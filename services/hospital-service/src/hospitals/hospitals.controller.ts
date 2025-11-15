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
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { HospitalsService } from './hospitals.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
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
  findAll() {
    return this.hospitalsService.findAll();
  }

  @Get('stats')
  @Roles('ADMIN', 'HOSPITAL_MANAGER')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  getStats() {
    return this.hospitalsService.getHospitalStats();
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

  @Post('services/update-names')
  updateServiceNames() {
    return this.hospitalsService.updateServiceNames();
  }

}
