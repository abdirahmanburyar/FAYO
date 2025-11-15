import { Module } from '@nestjs/common';
import { HospitalDoctorsController } from './hospital-doctors.controller';
import { HospitalDoctorsService } from './hospital-doctors.service';

@Module({
  controllers: [HospitalDoctorsController],
  providers: [HospitalDoctorsService],
  exports: [HospitalDoctorsService],
})
export class HospitalDoctorsModule {}
