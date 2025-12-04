import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { WaafipayService } from './waafipay.service';
import { QrCodeService } from '../common/qr-code/qr-code.service';
import { PaymentPollingService } from './payment-polling.service';
import { PaymentsService } from '../payments/payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { WaafipayCallbackDto } from './dto/waafipay-callback.dto';
import { RabbitMQService } from '../common/rabbitmq/rabbitmq.service';
import { WaafipayGateway } from './waafipay.gateway';
import { PrismaService } from '../common/database/prisma.service';
import { PaymentMethod } from '../payments/dto/create-payment.dto';

@Controller('waafipay')
@UseGuards(ThrottlerGuard)
export class WaafipayController {
  constructor(
    private readonly waafipayService: WaafipayService,
    private readonly qrCodeService: QrCodeService,
    private readonly paymentPollingService: PaymentPollingService,
    private readonly paymentsService: PaymentsService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly waafipayGateway: WaafipayGateway,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generate QR code for appointment payment
   */
  @Get('appointment/:appointmentId/qr')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async generateQrCode(@Param('appointmentId') appointmentId: string) {
    // Get appointment to fetch amount
    // Note: This would require appointment-service integration
    // For now, we'll return the QR code content
    
    const qrContent = this.qrCodeService.generateQrCodeContent();
    const qrType = this.qrCodeService.getQrCodeType();

    if (!qrContent) {
      throw new Error('QR code generation failed: No account number or phone number configured');
    }

    return {
      qrCode: qrContent,
      qrCodeType: qrType,
      appointmentId,
      message: 'Scan this QR code to initiate payment',
    };
  }

  /**
   * Initiate payment with Waafipay
   */
  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async initiatePayment(@Body() dto: InitiatePaymentDto) {
    // Validate account/phone if provided (otherwise defaults to 529988 in service)
    const accountNumber = dto.accountNumber;
    const phoneNumber = dto.phoneNumber;
    
    if (accountNumber) {
      const validation = this.qrCodeService.validateQrCodeContent(accountNumber);
      if (!validation.valid) {
        throw new Error(`Invalid account number: ${validation.error}`);
      }
    }
    
    if (phoneNumber) {
      const validation = this.qrCodeService.validateQrCodeContent(phoneNumber);
      if (!validation.valid) {
        throw new Error(`Invalid phone number: ${validation.error}`);
      }
    }
    
    // If neither provided, service will use default account 529988

    // Initiate payment with Waafipay
    const waafipayResponse = await this.waafipayService.initiatePayment(dto);

    // Create payment record
    const payment = await this.paymentsService.create({
      appointmentId: dto.appointmentId,
      amount: dto.amount,
      currency: dto.currency || 'USD',
      paymentMethod: PaymentMethod.MOBILE_MONEY,
      transactionId: waafipayResponse.transactionId,
      notes: `Waafipay payment - ${waafipayResponse.referenceId}`,
      metadata: {
        waafipay: {
          transactionId: waafipayResponse.transactionId,
          referenceId: waafipayResponse.referenceId,
          status: waafipayResponse.status,
          responseCode: waafipayResponse.responseCode,
          responseMsg: waafipayResponse.responseMsg,
          accountNumber: accountNumber,
          phoneNumber: phoneNumber,
        },
      },
    });

    // Start polling for payment status
    if (waafipayResponse.transactionId && waafipayResponse.referenceId) {
      this.paymentPollingService.startPolling(
        payment.id,
        dto.appointmentId,
        waafipayResponse.transactionId,
        waafipayResponse.referenceId,
      );
    }

    // Broadcast via WebSocket
    this.waafipayGateway.broadcastPaymentInitiated({
      id: payment.id,
      appointmentId: payment.appointmentId,
      transactionId: payment.transactionId,
      amount: payment.amount,
      status: 'INITIATED',
    });

    // Publish RabbitMQ event
    await this.rabbitMQService.publishPaymentInitiated(payment);

    return {
      paymentId: payment.id,
      appointmentId: dto.appointmentId,
      transactionId: waafipayResponse.transactionId,
      referenceId: waafipayResponse.referenceId,
      status: 'PENDING',
      message: 'Payment initiated successfully. Waiting for confirmation.',
    };
  }

  /**
   * Webhook endpoint for Waafipay callbacks
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async handleWebhook(@Body() callback: WaafipayCallbackDto) {
    const webhookData = this.waafipayService.processWebhook(callback);

    // Find payment by transaction ID or reference ID
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { transactionId: webhookData.transactionId },
          { metadata: { path: ['waafipay', 'referenceId'], equals: webhookData.referenceId } },
        ],
      },
    });

    if (!payment) {
      return { message: 'Payment not found', received: true };
    }

    const status = webhookData.status?.toUpperCase();
    const responseCode = webhookData.responseCode;

    // Update payment status based on webhook
    if (status === 'COMPLETED' || status === 'SUCCESS' || responseCode === '200' || responseCode === '0') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: 'PAID',
          processedAt: new Date(),
          paymentDate: new Date(),
          metadata: {
            ...(payment.metadata as any),
            waafipay: {
              ...((payment.metadata as any)?.waafipay || {}),
              ...webhookData,
              webhookReceivedAt: new Date().toISOString(),
            },
          },
        },
      });

      // Stop polling (if running)
      this.paymentPollingService.stopPolling(payment.id);

      // Broadcast via WebSocket
      this.waafipayGateway.broadcastPaymentCompleted({
        id: payment.id,
        appointmentId: payment.appointmentId,
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: 'COMPLETED',
      });

      // Publish RabbitMQ event
      await this.rabbitMQService.publishPaymentCompleted(payment);
    } else if (status === 'FAILED' || status === 'CANCELLED') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: 'CANCELLED',
          metadata: {
            ...(payment.metadata as any),
            waafipay: {
              ...((payment.metadata as any)?.waafipay || {}),
              ...webhookData,
              webhookReceivedAt: new Date().toISOString(),
            },
          },
        },
      });

      // Stop polling (if running)
      this.paymentPollingService.stopPolling(payment.id);

      // Broadcast via WebSocket
      this.waafipayGateway.broadcastPaymentFailed(
        {
          id: payment.id,
          appointmentId: payment.appointmentId,
          transactionId: payment.transactionId,
          amount: payment.amount,
          status: 'FAILED',
        },
        webhookData.responseMsg,
      );

      // Publish RabbitMQ event
      await this.rabbitMQService.publishPaymentFailed(payment, webhookData.responseMsg);
    }

    return { message: 'Webhook processed', received: true };
  }

  /**
   * Get USSD code information for Waafipay
   */
  @Get('ussd-info')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getUssdInfo() {
    // Return USSD code and account information
    return {
      accountNumber: '529988',
      ussdCode: '*252#',
      instructions: 'Dial *252# and follow the prompts to send money to account 529988',
      message: 'Use USSD code *252# to complete your payment',
    };
  }

  /**
   * Check payment status
   */
  @Get('status/:paymentId')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getPaymentStatus(@Param('paymentId') paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const metadata = payment.metadata as any;
    const waafipayData = metadata?.waafipay || {};

    return {
      paymentId: payment.id,
      appointmentId: payment.appointmentId,
      status: payment.paymentStatus,
      transactionId: payment.transactionId || waafipayData.transactionId,
      referenceId: waafipayData.referenceId,
      amount: payment.amount,
      currency: payment.currency,
      message: waafipayData.responseMsg,
    };
  }
}

