import { Module } from '@nestjs/common';
import { WaafipayService } from './waafipay.service';
import { WaafipayController } from './waafipay.controller';
import { WaafipayGateway } from './waafipay.gateway';
import { PaymentPollingService } from './payment-polling.service';
import { QrCodeService } from '../common/qr-code/qr-code.service';
import { PaymentsModule } from '../payments/payments.module';
import { DatabaseModule } from '../common/database/database.module';
import { RabbitMQModule } from '../common/rabbitmq/rabbitmq.module';

@Module({
  imports: [PaymentsModule, DatabaseModule, RabbitMQModule],
  controllers: [WaafipayController],
  providers: [
    WaafipayService,
    WaafipayGateway,
    PaymentPollingService,
    QrCodeService,
  ],
  exports: [WaafipayService, QrCodeService],
})
export class WaafipayModule {}

