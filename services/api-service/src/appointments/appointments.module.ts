import { Module, forwardRef } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentGateway } from './appointment.gateway';
import { UsersModule } from '../users/users.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { HospitalsModule } from '../hospitals/hospitals.module';
import { SpecialtiesModule } from '../specialties/specialties.module';

@Module({
  imports: [
    UsersModule,
    DoctorsModule,
    HospitalsModule,
    SpecialtiesModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentGateway],
  exports: [AppointmentsService, AppointmentGateway],
})
export class AppointmentsModule {}

