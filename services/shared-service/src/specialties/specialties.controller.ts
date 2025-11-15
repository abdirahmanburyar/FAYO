import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SpecialtiesService } from './specialties.service';
import { CreateSpecialtyDto, UpdateSpecialtyDto } from './dto';
import { Specialty } from './entities/specialty.entity';

@ApiTags('Specialties')
@Controller('specialties')
@UseGuards(ThrottlerGuard)
export class SpecialtiesController {
  constructor(private readonly specialtiesService: SpecialtiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new specialty' })
  @ApiResponse({ status: 201, description: 'Specialty created successfully', type: Specialty })
  @ApiResponse({ status: 409, description: 'Specialty with this name already exists' })
  @ApiBearerAuth()
  create(@Body() createSpecialtyDto: CreateSpecialtyDto) {
    return this.specialtiesService.create(createSpecialtyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active specialties' })
  @ApiResponse({ status: 200, description: 'List of specialties', type: [Specialty] })
  @ApiQuery({ name: 'includeInactive', required: false, description: 'Include inactive specialties' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    if (includeInactive === 'true') {
      return this.specialtiesService.findAllWithInactive();
    }
    
    return this.specialtiesService.findAll();
  }


  @Get('stats')
  @ApiOperation({ summary: 'Get specialty statistics' })
  @ApiResponse({ status: 200, description: 'Specialty statistics' })
  getStats() {
    return this.specialtiesService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specialty by ID' })
  @ApiResponse({ status: 200, description: 'Specialty found', type: Specialty })
  @ApiResponse({ status: 404, description: 'Specialty not found' })
  findOne(@Param('id') id: string) {
    return this.specialtiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update specialty' })
  @ApiResponse({ status: 200, description: 'Specialty updated successfully', type: Specialty })
  @ApiResponse({ status: 404, description: 'Specialty not found' })
  @ApiResponse({ status: 409, description: 'Specialty with this name already exists' })
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateSpecialtyDto: UpdateSpecialtyDto) {
    return this.specialtiesService.update(id, updateSpecialtyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete specialty' })
  @ApiResponse({ status: 200, description: 'Specialty deleted successfully' })
  @ApiResponse({ status: 404, description: 'Specialty not found' })
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.specialtiesService.remove(id);
  }
}
