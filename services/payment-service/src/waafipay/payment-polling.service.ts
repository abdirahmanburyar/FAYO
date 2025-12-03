import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { WaafipayService } from './waafipay.service';
import { WaafipayGateway } from './waafipay.gateway';
import { PaymentsService } from '../payments/payments.service';
import { PaymentStatus } from '@prisma/client';

interface PollingJob {
  paymentId: string;
  appointmentId: string;
  transactionId: string;
  referenceId: string;
  startTime: Date;
  maxAttempts: number;
  attemptCount: number;
  interval: NodeJS.Timeout;
}

@Injectable()
export class PaymentPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentPollingService.name);
  private readonly pollingJobs = new Map<string, PollingJob>();
  private readonly pollingInterval = 10000; // 10 seconds
  private readonly maxPollingAttempts = 60; // 10 minutes max (60 * 10 seconds)
  private readonly maxPollingDuration = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly waafipayService: WaafipayService,
    private readonly waafipayGateway: WaafipayGateway,
    private readonly paymentsService: PaymentsService,
  ) {}

  onModuleInit() {
    this.logger.log('✅ Payment Polling Service initialized');
  }

  onModuleDestroy() {
    // Stop all polling jobs
    this.pollingJobs.forEach((job) => {
      clearInterval(job.interval);
    });
    this.pollingJobs.clear();
    this.logger.log('🛑 Payment Polling Service stopped');
  }

  /**
   * Start polling for payment status
   */
  startPolling(
    paymentId: string,
    appointmentId: string,
    transactionId: string,
    referenceId: string,
  ): void {
    // Stop existing polling if any
    this.stopPolling(paymentId);

    const startTime = new Date();
    let attemptCount = 0;

    const interval = setInterval(async () => {
      attemptCount++;
      const elapsed = Date.now() - startTime.getTime();

      // Check if max duration exceeded
      if (elapsed > this.maxPollingDuration) {
        this.logger.warn(`⏱️ Polling timeout for payment ${paymentId} after ${this.maxPollingDuration}ms`);
        this.stopPolling(paymentId);
        return;
      }

      // Check if max attempts exceeded
      if (attemptCount > this.maxPollingAttempts) {
        this.logger.warn(`⏱️ Polling max attempts reached for payment ${paymentId}`);
        this.stopPolling(paymentId);
        return;
      }

      try {
        this.logger.log(`🔍 Polling payment status (attempt ${attemptCount}): ${transactionId}`);

        const statusResponse = await this.waafipayService.checkPaymentStatus(
          transactionId,
          referenceId,
        );

        const status = statusResponse.status?.toUpperCase();
        const responseCode = statusResponse.responseCode;

        this.logger.log(`📥 Payment status: ${status}, Response code: ${responseCode}`);

        // Check if payment is completed
        if (status === 'COMPLETED' || status === 'SUCCESS' || responseCode === '200' || responseCode === '0') {
          await this.handlePaymentCompleted(paymentId, appointmentId, statusResponse);
          this.stopPolling(paymentId);
          return;
        }

        // Check if payment failed
        if (
          status === 'FAILED' ||
          status === 'CANCELLED' ||
          (responseCode && responseCode !== '200' && responseCode !== '0' && responseCode !== 'PENDING')
        ) {
          await this.handlePaymentFailed(paymentId, appointmentId, statusResponse);
          this.stopPolling(paymentId);
          return;
        }

        // Payment still pending/processing
        this.logger.log(`⏳ Payment ${paymentId} still pending/processing...`);
      } catch (error) {
        this.logger.error(`❌ Error polling payment status:`, error);
        // Continue polling on error (might be temporary network issue)
      }
    }, this.pollingInterval);

    // Store polling job
    this.pollingJobs.set(paymentId, {
      paymentId,
      appointmentId,
      transactionId,
      referenceId,
      startTime,
      maxAttempts: this.maxPollingAttempts,
      attemptCount: 0,
      interval,
    });

    this.logger.log(`🔄 Started polling for payment ${paymentId} (transaction: ${transactionId})`);
  }

  /**
   * Stop polling for a payment
   */
  stopPolling(paymentId: string): void {
    const job = this.pollingJobs.get(paymentId);
    if (job) {
      clearInterval(job.interval);
      this.pollingJobs.delete(paymentId);
      this.logger.log(`🛑 Stopped polling for payment ${paymentId}`);
    }
  }

  /**
   * Handle payment completed
   */
  private async handlePaymentCompleted(
    paymentId: string,
    appointmentId: string,
    statusResponse: any,
  ): Promise<void> {
    try {
      this.logger.log(`✅ Payment completed: ${paymentId}`);

      // Update payment record
      const payment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          paymentStatus: 'PAID',
          transactionId: statusResponse.transactionId,
          processedAt: new Date(),
          paymentDate: new Date(),
          metadata: {
            ...statusResponse,
            completedAt: new Date().toISOString(),
          },
        },
      });

      // Broadcast via WebSocket
      this.waafipayGateway.broadcastPaymentCompleted({
        id: payment.id,
        appointmentId: payment.appointmentId,
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: 'COMPLETED',
      });

      this.logger.log(`✅ Payment ${paymentId} marked as completed`);
    } catch (error) {
      this.logger.error(`❌ Error handling payment completion:`, error);
    }
  }

  /**
   * Handle payment failed
   */
  private async handlePaymentFailed(
    paymentId: string,
    appointmentId: string,
    statusResponse: any,
  ): Promise<void> {
    try {
      this.logger.log(`❌ Payment failed: ${paymentId}`);

      // Update payment record
      const payment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          paymentStatus: 'CANCELLED',
          metadata: {
            ...statusResponse,
            failedAt: new Date().toISOString(),
            error: statusResponse.responseMsg,
          },
        },
      });

      // Broadcast via WebSocket
      this.waafipayGateway.broadcastPaymentFailed(
        {
          id: payment.id,
          appointmentId: payment.appointmentId,
          transactionId: payment.transactionId,
          amount: payment.amount,
          status: 'FAILED',
        },
        statusResponse.responseMsg,
      );

      this.logger.log(`❌ Payment ${paymentId} marked as failed`);
    } catch (error) {
      this.logger.error(`❌ Error handling payment failure:`, error);
    }
  }
}

