import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { TriageService } from './triage.service';
import { CreateTriageDto, UpdateTriageResultDto } from './dto';

@Controller('triage')
export class TriageController {
  constructor(private readonly triageService: TriageService) {}

  @Post()
  create(@Body() createTriageDto: CreateTriageDto) {
    return this.triageService.create(createTriageDto);
  }

  @Post('predict')
  async predictSpecialty(@Body() body: { symptoms: string }) {
    const result = await this.triageService.predictSpecialty(body.symptoms);
    return result;
  }

  @Get()
  findAll() {
    return this.triageService.findAll();
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) {
    return this.triageService.findByPatient(patientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.triageService.findOne(id);
  }

  @Patch(':id/result')
  updateTriageResult(
    @Param('id') id: string,
    @Body() updateTriageResultDto: UpdateTriageResultDto,
  ) {
    return this.triageService.updateTriageResult(
      id,
      updateTriageResultDto.predictedSpecialty,
      updateTriageResultDto.urgency,
    );
  }
}
