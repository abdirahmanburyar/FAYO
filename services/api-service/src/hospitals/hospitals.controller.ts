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
import { Public } from '../auth/decorators/public.decorator';

@Controller('hospitals')
@UseGuards(JwtAuthGuard)
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  create(@Body() createHospitalDto: CreateHospitalDto) {
    return this.hospitalsService.create(createHospitalDto);
  }

  @Get()
  @Public()
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const decodedSearch = search ? decodeURIComponent(search).trim() : undefined;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    
    return await this.hospitalsService.findAll({
      page: pageNum,
      limit: limitNum,
      search: decodedSearch || undefined,
    });
  }

  @Get('stats')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  getStats() {
    return this.hospitalsService.getHospitalStats();
  }

  @Get('by-user/:userId')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  findByUserId(@Param('userId') userId: string) {
    return this.hospitalsService.findByUserId(userId);
  }

  @Get(':id')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  findOne(@Param('id') id: string) {
    return this.hospitalsService.findOne(id);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  update(@Param('id') id: string, @Body() updateHospitalDto: UpdateHospitalDto, @Request() req) {
    return this.hospitalsService.update(id, updateHospitalDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  remove(@Param('id') id: string, @Request() req) {
    return this.hospitalsService.remove(id);
  }

  @Post(':id/specialties')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  addSpecialty(@Param('id') hospitalId: string, @Body('specialtyId') specialtyId: string, @Request() req) {
    return this.hospitalsService.addSpecialty(hospitalId, specialtyId);
  }

  @Delete(':id/specialties/:specialtyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  removeSpecialty(@Param('id') hospitalId: string, @Param('specialtyId') specialtyId: string, @Request() req) {
    return this.hospitalsService.removeSpecialty(hospitalId, specialtyId);
  }

  @Get(':id/services')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  getServices(@Param('id') hospitalId: string) {
    return this.hospitalsService.getServices(hospitalId);
  }

  @Post(':id/services')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  addService(@Param('id') hospitalId: string, @Body('serviceId') serviceId: string, @Request() req) {
    return this.hospitalsService.addService(hospitalId, serviceId);
  }

  @Delete(':id/services/:serviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  removeService(@Param('id') hospitalId: string, @Param('serviceId') serviceId: string, @Request() req) {
    return this.hospitalsService.removeService(hospitalId, serviceId);
  }

  @Post(':id/doctors/:doctorId')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  addDoctor(
    @Param('id') hospitalId: string,
    @Param('doctorId') doctorId: string,
    @Body() addDoctorDto: AddDoctorDto,
    @Request() req
  ) {
    return this.hospitalsService.addDoctor(hospitalId, doctorId, addDoctorDto);
  }

  @Patch(':id/doctors/:doctorId')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
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
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  removeDoctor(
    @Param('id') hospitalId: string,
    @Param('doctorId') doctorId: string,
    @Request() req
  ) {
    return this.hospitalsService.removeDoctor(hospitalId, doctorId);
  }

  @Get('doctors/:doctorId/hospitals')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  getHospitalsForDoctor(@Param('doctorId') doctorId: string) {
    return this.hospitalsService.getHospitalsForDoctor(doctorId);
  }

  @Get(':id/doctors')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  getDoctors(@Param('id') hospitalId: string) {
    return this.hospitalsService.getDoctors(hospitalId);
  }
}

