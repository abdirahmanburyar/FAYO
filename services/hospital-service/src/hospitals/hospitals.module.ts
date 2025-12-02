import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from './hospitals.service';
import { DatabaseModule } from '../common/database/database.module';
import { SpecialtyServiceModule } from '../common/specialty-service/specialty-service.module';
import { RawWebSocketGateway } from '../websocket/raw-websocket.gateway';

@Module({
  imports: [DatabaseModule, SpecialtyServiceModule, HttpModule],
  controllers: [HospitalsController],
  providers: [HospitalsService, RawWebSocketGateway],
  exports: [HospitalsService, RawWebSocketGateway],
})
export class HospitalsModule {}
