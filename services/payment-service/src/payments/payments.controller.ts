import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Controller('payments')
@UseGuards(ThrottlerGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  findAll(
    @Query('appointmentId') appointmentId?: string,
    @Query('adId') adId?: string,
    @Query('paymentType') paymentType?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.paymentsService.findAll({
      appointmentId,
      adId,
      paymentType,
      paymentStatus,
      paymentMethod,
      startDate,
      endDate,
    });
  }

  @Get('appointment/:appointmentId')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  findByAppointmentId(@Param('appointmentId') appointmentId: string) {
    return this.paymentsService.findByAppointmentId(appointmentId);
  }

  @Get('ad/:adId')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  findByAdId(@Param('adId') adId: string) {
    return this.paymentsService.findByAdId(adId);
  }

  @Get(':id')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id/process')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  processPayment(
    @Param('id') id: string,
    @Body('processedBy') processedBy: string,
  ) {
    if (!processedBy) {
      throw new Error('processedBy is required in request body');
    }
    return this.paymentsService.processPayment(id, processedBy);
  }

  @Patch(':id/refund')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  refund(
    @Param('id') id: string,
    @Body('refundReason') refundReason: string,
    @Body('refundedBy') refundedBy: string,
  ) {
    if (!refundReason || !refundedBy) {
      throw new Error('refundReason and refundedBy are required in request body');
    }
    return this.paymentsService.refund(id, refundReason, refundedBy);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    // For now, just return the update DTO - implement update logic if needed
    return { id, ...updatePaymentDto };
  }
}

