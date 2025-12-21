import { Module } from '@nestjs/common';
import { AdsService } from './ads.service';
import { AdsController } from './ads.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService], // Export so other modules can use it
})
export class AdsModule {}

