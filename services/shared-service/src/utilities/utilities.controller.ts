import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';
import { UtilitiesService } from './utilities.service';

@ApiTags('Utilities')
@Controller('utilities')
@UseGuards(ThrottlerGuard)
export class UtilitiesController {
  constructor(private readonly utilitiesService: UtilitiesService) {}

  @Get('countries')
  @ApiOperation({ summary: 'Get all countries' })
  @ApiResponse({ status: 200, description: 'List of countries' })
  getCountries() {
    return this.utilitiesService.getCountries();
  }

  @Get('cities')
  @ApiOperation({ summary: 'Get cities' })
  @ApiResponse({ status: 200, description: 'List of cities' })
  @ApiQuery({ name: 'countryId', required: false, description: 'Filter by country ID' })
  getCities(@Query('countryId') countryId?: string) {
    return this.utilitiesService.getCities(countryId);
  }


  @Get('services')
  @ApiOperation({ summary: 'Get services' })
  @ApiResponse({ status: 200, description: 'List of services' })
  getServices() {
    return this.utilitiesService.getServices();
  }

  @Get('specialties')
  @ApiOperation({ summary: 'Get specialties' })
  @ApiResponse({ status: 200, description: 'List of specialties' })
  getSpecialties() {
    return this.utilitiesService.getSpecialties();
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get all settings' })
  @ApiResponse({ status: 200, description: 'List of settings' })
  getSettings() {
    return this.utilitiesService.getSettings();
  }

  @Get('reference-data')
  @ApiOperation({ summary: 'Get all reference data' })
  @ApiResponse({ status: 200, description: 'All reference data' })
  getAllReferenceData() {
    return this.utilitiesService.getAllReferenceData();
  }
}