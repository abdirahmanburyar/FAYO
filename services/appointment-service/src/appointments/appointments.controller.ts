import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) {
    return this.appointmentsService.findByPatient(patientId);
  }

  @Get('doctor/:doctorId')
  findByDoctor(@Param('doctorId') doctorId: string) {
    return this.appointmentsService.findByDoctor(doctorId);
  }

  @Get('specialty/:specialty')
  findBySpecialty(@Param('specialty') specialty: string) {
    return this.appointmentsService.findBySpecialty(specialty);
  }

  @Get('slots/:doctorId')
  getAvailableSlots(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    const appointmentDate = new Date(date);
    return this.appointmentsService.getAvailableSlots(doctorId, appointmentDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.appointmentsService.cancel(id);
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.appointmentsService.confirm(id);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string) {
    return this.appointmentsService.complete(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.cancel(id);
  }
}
