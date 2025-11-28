import { Module } from '@nestjs/common';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { SpecialtyServiceModule } from '../common/specialty-service/specialty-service.module';

@Module({
  imports: [SpecialtyServiceModule],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
