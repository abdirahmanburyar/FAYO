import { Module } from '@nestjs/common';
import { AppointmentGateway } from './appointment.gateway';

@Module({
  providers: [AppointmentGateway],
  exports: [AppointmentGateway],
})
export class WebsocketModule {}

