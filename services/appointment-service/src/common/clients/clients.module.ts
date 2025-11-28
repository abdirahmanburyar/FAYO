import { Module } from '@nestjs/common';
import { DoctorServiceClient } from './doctor-service.client';
import { HospitalServiceClient } from './hospital-service.client';
import { UserServiceClient } from './user-service.client';
import { SpecialtyServiceClient } from './specialty-service.client';

@Module({
  providers: [
    DoctorServiceClient,
    HospitalServiceClient,
    UserServiceClient,
    SpecialtyServiceClient,
  ],
  exports: [
    DoctorServiceClient,
    HospitalServiceClient,
    UserServiceClient,
    SpecialtyServiceClient,
  ],
})
export class ClientsModule {}

