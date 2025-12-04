import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { WaafipayService } from './waafipay.service';
import { WaafipayController } from './waafipay.controller';
import { WaafipayGateway } from './waafipay.gateway';
import { PaymentPollingService } from './payment-polling.service';
import { QrCodeService } from '../common/qr-code/qr-code.service';
import { PaymentsModule } from '../payments/payments.module';
import { DatabaseModule } from '../common/database/database.module';
import { RabbitMQModule } from '../common/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    PaymentsModule,
    DatabaseModule,
    RabbitMQModule,
    ThrottlerModule, // Required for ThrottlerGuard in controller
  ],
  controllers: [WaafipayController],
  providers: [
    WaafipayService,
    WaafipayGateway,
    PaymentPollingService,
    QrCodeService,
  ],
  exports: [WaafipayService, QrCodeService],
})
export class WaafipayModule implements OnModuleInit {
  private readonly logger = new Logger(WaafipayModule.name);

  onModuleInit() {
    this.logger.log('✅ WaafipayModule initialized');
  }
}

