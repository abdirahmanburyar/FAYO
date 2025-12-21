import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CreatePaymentDto, PaymentType } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentStatus, PaymentType as PrismaPaymentType } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    try {
      const paymentType = createPaymentDto.paymentType || PaymentType.APPOINTMENT;
      
      if (paymentType === PaymentType.APPOINTMENT && !createPaymentDto.appointmentId) {
        throw new BadRequestException('appointmentId is required for appointment payments');
      }
      
      if (paymentType === PaymentType.AD && !createPaymentDto.adId) {
        throw new BadRequestException('adId is required for ad payments');
      }

      const receiptNumber = await this.generateReceiptNumber();

      const payment = await this.prisma.payment.create({
        data: {
          paymentType: paymentType === PaymentType.AD ? PrismaPaymentType.AD : PrismaPaymentType.APPOINTMENT,
          appointmentId: createPaymentDto.appointmentId,
          adId: createPaymentDto.adId,
          amount: createPaymentDto.amount,
          currency: createPaymentDto.currency || 'USD',
          paymentMethod: createPaymentDto.paymentMethod,
          paymentStatus: PaymentStatus.PAID,
          transactionId: createPaymentDto.transactionId,
          receiptNumber,
          paidBy: createPaymentDto.paidBy,
          processedBy: createPaymentDto.processedBy,
          notes: createPaymentDto.notes,
          metadata: createPaymentDto.metadata || {},
        },
      });

      this.logger.log(`✅ Payment created: ${payment.id}, Receipt: ${receiptNumber}, Type: ${paymentType}`);

      return payment;
    } catch (error) {
      this.logger.error(`❌ Error creating payment:`, error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async processPayment(paymentId: string, processedBy: string) {
    try {
      this.logger.log(`💳 Processing payment: ${paymentId}`);

      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new NotFoundException(`Payment with ID ${paymentId} not found`);
      }

      if (payment.paymentStatus === PaymentStatus.PAID) {
        this.logger.log(`ℹ️ Payment ${paymentId} is already paid, returning existing payment`);
        return payment;
      }

      if (payment.paymentStatus === PaymentStatus.REFUNDED) {
        throw new BadRequestException('Cannot process a refunded payment');
      }

      if (payment.paymentStatus === PaymentStatus.CANCELLED) {
        throw new BadRequestException('Cannot process a cancelled payment');
      }

      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          processedBy,
          processedAt: new Date(),
          paymentDate: new Date(),
        },
      });

      this.logger.log(`✅ Payment processed: ${paymentId}`);

      return updatedPayment;
    } catch (error) {
      this.logger.error(`❌ Error processing payment:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByAppointmentId(appointmentId: string) {
    return this.prisma.payment.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByAdId(adId: string) {
    return this.prisma.payment.findMany({
      where: { adId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(filters?: {
    appointmentId?: string;
    adId?: string;
    paymentType?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (filters?.appointmentId) {
      where.appointmentId = filters.appointmentId;
    }

    if (filters?.adId) {
      where.adId = filters.adId;
    }

    if (filters?.paymentType) {
      where.paymentType = filters.paymentType;
    }

    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters?.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    return this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async refund(paymentId: string, refundReason: string, refundedBy: string) {
    try {
      this.logger.log(`💳 Refunding payment: ${paymentId}`);

      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new NotFoundException(`Payment with ID ${paymentId} not found`);
      }

      if (payment.paymentStatus === PaymentStatus.REFUNDED) {
        throw new BadRequestException('Payment is already refunded');
      }

      if (payment.paymentStatus !== PaymentStatus.PAID) {
        throw new BadRequestException('Only paid payments can be refunded');
      }

      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          refundReason,
          refundedBy,
          refundedAt: new Date(),
        },
      });

      this.logger.log(`✅ Payment refunded: ${paymentId}`);

      return updatedPayment;
    } catch (error) {
      this.logger.error(`❌ Error refunding payment:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to refund payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async generateReceiptNumber(): Promise<string> {
    const payments = await this.prisma.payment.findMany({
      where: {
        receiptNumber: {
          not: null,
        },
      },
      select: {
        receiptNumber: true,
      },
    });

    let maxNumber = 0;

    for (const payment of payments) {
      if (payment.receiptNumber) {
        const numericValue = parseInt(payment.receiptNumber, 10);
        if (!isNaN(numericValue) && numericValue > maxNumber) {
          maxNumber = numericValue;
        }
      }
    }

    const nextNumber = maxNumber + 1;
    const receiptNumber = nextNumber < 1000 
      ? nextNumber.toString().padStart(3, '0')
      : nextNumber.toString();

    const existing = await this.prisma.payment.findUnique({
      where: { receiptNumber },
    });

    if (existing) {
      return this.generateReceiptNumber();
    }

    return receiptNumber;
  }
}

