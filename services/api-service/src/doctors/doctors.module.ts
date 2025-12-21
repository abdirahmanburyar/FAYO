import { Module, forwardRef } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { SpecialtiesModule } from '../specialties/specialties.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    SpecialtiesModule,
    UsersModule,
  ],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}

