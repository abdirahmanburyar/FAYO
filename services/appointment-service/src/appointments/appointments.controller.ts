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
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Controller('appointments')
@UseGuards(ThrottlerGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 requests per minute
  findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('hospitalId') hospitalId?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.findAll({
      patientId,
      doctorId,
      hospitalId,
      status,
      paymentStatus,
      date,
    });
  }

  @Get('patient/:patientId')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  findByPatient(@Param('patientId') patientId: string) {
    return this.appointmentsService.findAll({ patientId });
  }

  @Get('doctor/:doctorId')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  findByDoctor(@Param('doctorId') doctorId: string) {
    return this.appointmentsService.findAll({ doctorId });
  }

  @Get('hospital/:hospitalId')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  findByHospital(@Param('hospitalId') hospitalId: string) {
    return this.appointmentsService.findAll({ hospitalId });
  }

  @Get('stats')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  getStats() {
    return this.appointmentsService.getStats();
  }

  @Get(':id')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Patch(':id/confirm')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  confirm(@Param('id') id: string) {
    return this.appointmentsService.confirm(id);
  }

  @Patch(':id/complete')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  complete(@Param('id') id: string, @Body('notes') notes?: string) {
    return this.appointmentsService.complete(id, notes);
  }

  @Patch(':id/cancel')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  cancel(
    @Param('id') id: string,
    @Body('cancelledBy') cancelledBy: string,
    @Body('reason') reason?: string,
  ) {
    return this.appointmentsService.cancel(id, cancelledBy, reason);
  }

  @Patch(':id/reschedule')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  reschedule(
    @Param('id') id: string,
    @Body('newDate') newDate: string,
    @Body('newTime') newTime: string,
  ) {
    return this.appointmentsService.reschedule(id, newDate, newTime);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

}

