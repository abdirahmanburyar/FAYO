import { Module, forwardRef } from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { HospitalsController } from './hospitals.controller';
import { SpecialtiesModule } from '../specialties/specialties.module';
import { UsersModule } from '../users/users.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    SpecialtiesModule,
    UsersModule,
    DoctorsModule,
    NotificationsModule,
  ],
  controllers: [HospitalsController],
  providers: [HospitalsService],
  exports: [HospitalsService],
})
export class HospitalsModule {}

