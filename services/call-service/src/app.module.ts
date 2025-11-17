import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './common/database/database.module';
import { CallsModule } from './calls/calls.module';
import { ZoomModule } from './zoom/zoom.module';
import { KafkaModule } from './messaging/kafka/kafka.module';
import { RabbitmqModule } from './messaging/rabbitmq/rabbitmq.module';
import { GatewayModule } from './gateway/gateway.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    AuthModule,
    ZoomModule,
    KafkaModule,
    RabbitmqModule,
    CallsModule,
    GatewayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

