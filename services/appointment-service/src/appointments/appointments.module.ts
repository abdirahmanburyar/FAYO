import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { DatabaseModule } from '../common/database/database.module';
import { ClientsModule } from '../common/clients/clients.module';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [DatabaseModule, ClientsModule, RabbitMQModule, WebsocketModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}

