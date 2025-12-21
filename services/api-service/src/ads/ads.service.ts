import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CreateAdDto, AdStatusEnum } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentsService } from '../payments/payments.service';
import { PaymentType, PaymentMethod } from '../payments/dto/create-payment.dto';

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Convert Prisma Decimal price to number for JSON serialization
   */
  private convertPriceToNumber(price: any): number {
    if (price === null || price === undefined) return 0;
    if (typeof price === 'number') return price;
    if (typeof price === 'string') return parseFloat(price) || 0;
    if (typeof price === 'object' && price !== null) {
      // Prisma Decimal object
      return parseFloat(price.toString()) || 0;
    }
    return 0;
  }

  /**
   * Transform ad object to convert Decimal price to number and calculate range from dates
   */
  private transformAd(ad: any): any {
    if (!ad) return ad;
    
    // Calculate range from startDate and endDate
    let range = 0;
    if (ad.startDate && ad.endDate) {
      const start = new Date(ad.startDate);
      const end = new Date(ad.endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      range = Math.max(0, diffDays);
    }
    
    return {
      ...ad,
      price: this.convertPriceToNumber(ad.price),
      range, // Calculate range from dates
    };
  }

  async create(createAdDto: CreateAdDto) {
    const startDate = new Date(createAdDto.startDate);
    const endDate = new Date(startDate);
    // endDate = startDate + range (e.g., 11/12 + 5 = 16/12)
    endDate.setDate(endDate.getDate() + createAdDto.range);

    const ad = await this.prisma.ad.create({
      data: {
        title: createAdDto.title || createAdDto.company, // Fallback to company if title not provided
        company: createAdDto.company,
        description: createAdDto.description,
        imageUrl: createAdDto.imageUrl,
        linkUrl: createAdDto.linkUrl,
        type: undefined, // Type is no longer used, kept for database compatibility
        price: createAdDto.price, // Price per day in dollars
        startDate,
        endDate,
        status: createAdDto.status ?? AdStatusEnum.PENDING,
        createdBy: createAdDto.createdBy
      },
    });

    // Emit event for realtime update
    this.eventEmitter.emit('ad.created', ad);
    this.logger.log(`✅ Ad created: ${ad.id}`);

    return this.transformAd(ad);
  }

  async findAll(activeOnly: boolean = false, page: number = 1, limit: number = 50) {
    const where: any = {};
    const now = new Date();
    
    if (activeOnly) {
      // Only show PUBLISHED ads that are within date range
      where.status = AdStatusEnum.PUBLISHED;
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    }

    // Ensure reasonable limits to prevent overload
    const take = Math.min(Math.max(1, limit), 100); // Max 100 items per page
    const skip = Math.max(0, (page - 1) * take);

    const [data, total] = await Promise.all([
      this.prisma.ad.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        take,
        skip,
      }),
      this.prisma.ad.count({ where }),
    ]);

    // Convert Decimal price to number for JSON serialization
    const transformedData = data.map(ad => this.transformAd(ad));

    return {
      data: transformedData,
      pagination: {
        page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findActive(page: number = 1, limit: number = 50) {
    const now = new Date();
    
    // Ensure reasonable limits to prevent overload
    const take = Math.min(Math.max(1, limit), 100); // Max 100 items per page
    const skip = Math.max(0, (page - 1) * take);

    const [data, total] = await Promise.all([
      this.prisma.ad.findMany({
        where: {
          status: AdStatusEnum.PUBLISHED,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        orderBy: [{ createdAt: 'desc' }],
        take,
        skip,
      }),
      this.prisma.ad.count({
        where: {
          status: AdStatusEnum.PUBLISHED,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      }),
    ]);

    // Convert Decimal price to number for JSON serialization
    const transformedData = data.map(ad => this.transformAd(ad));

    return {
      data: transformedData,
      pagination: {
        page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id },
    });

    if (!ad) {
      throw new NotFoundException(`Ad with ID ${id} not found`);
    }

    return this.transformAd(ad);
  }

  async update(id: string, updateAdDto: UpdateAdDto) {
    const existingAd = await this.findOne(id);

    const updateData: any = { ...updateAdDto };
    
    // Calculate endDate if startDate or range changed
    let startDate = existingAd.startDate;
    // derive current range from existing dates
    const currentRange = Math.max(
      1,
      Math.round(
        (existingAd.endDate.getTime() - existingAd.startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    let range = currentRange;
    
    if (updateAdDto.startDate) {
      startDate = new Date(updateAdDto.startDate);
      updateData.startDate = startDate;
    }
    if (updateAdDto.range !== undefined) {
      range = updateAdDto.range;
    }
    
    // Recalculate endDate: endDate = startDate + range
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + range);
    updateData.endDate = endDate;

    const ad = await this.prisma.ad.update({
      where: { id },
      data: updateData,
    });

    // Emit event for realtime update
    this.eventEmitter.emit('ad.updated', ad);
    this.logger.log(`✅ Ad updated: ${ad.id}`);

    return this.transformAd(ad);
  }

  async remove(id: string) {
    const ad = await this.findOne(id);
    
    await this.prisma.ad.delete({
      where: { id },
    });

    // Emit event for realtime update
    this.eventEmitter.emit('ad.deleted', { id: ad.id });
    this.logger.log(`✅ Ad deleted: ${id}`);

    return { message: 'Ad deleted successfully' };
  }

  async incrementViewCount(id: string) {
    // Use raw query for better performance on high-frequency updates
    // This avoids loading the full record and is more efficient
    try {
      await this.prisma.$executeRaw`
        UPDATE ads.ads 
        SET "viewCount" = "viewCount" + 1, "updatedAt" = NOW()
        WHERE id = ${id}
      `;
      
      // Return minimal response without additional query
      return { id, success: true };
    } catch (error) {
      this.logger.error(`Failed to increment view count for ad ${id}:`, error);
      throw error;
    }
  }

  async incrementClickCount(id: string) {
    // Use raw query for better performance on high-frequency updates
    try {
      await this.prisma.$executeRaw`
        UPDATE ads.ads 
        SET "clickCount" = "clickCount" + 1, "updatedAt" = NOW()
        WHERE id = ${id}
      `;
      
      // Fetch only necessary fields for event emission (more efficient)
      const ad = await this.prisma.ad.findUnique({
        where: { id },
      });

      if (ad) {
        // Emit event for realtime update with minimal data
        this.eventEmitter.emit('ad.clicked', ad);
        return this.transformAd(ad);
      }
      
      return { id, success: true };
    } catch (error) {
      this.logger.error(`Failed to increment click count for ad ${id}:`, error);
      throw error;
    }
  }

  /**
   * Calculate ad fee based on price per day and duration
   * Formula: amount × days
   * @param range Number of days (can be 0, which results in $0)
   * @param price Price per day in dollars (will be converted to cents)
   * @returns Fee in cents (price × range)
   */
  calculateAdFee(range: number, price: number): number {
    // Validate inputs - range can be 0 (which means $0 fee)
    const validRange = Math.max(0, Math.floor(range || 0));
    // Price comes in as dollars, convert to cents
    const validPriceInDollars = Math.max(0, parseFloat(String(price)) || 0);
    const validPriceInCents = Math.floor(validPriceInDollars * 100);
    
    // Calculate: price per day (in cents) × number of days
    // If range is 0, result will be 0 (no charge)
    return validPriceInCents * validRange;
  }

  /**
   * Pay for an ad - creates payment and updates ad status to PUBLISHED
   */
  async payForAd(
    id: string,
    paymentData: {
      paymentMethod: PaymentMethod;
      paidBy?: string;
      processedBy?: string;
      notes?: string;
      transactionId?: string;
    },
  ) {
    // Find the ad
    const ad = await this.findOne(id);
    
    if (!ad) {
      throw new NotFoundException(`Ad with ID ${id} not found`);
    }

    // Calculate the fee
    const priceInDollars = this.convertPriceToNumber(ad.price);
    const range = ad.range !== undefined && ad.range !== null ? Number(ad.range) : 0;
    const amountInCents = this.calculateAdFee(range, priceInDollars);

    if (amountInCents <= 0) {
      throw new BadRequestException('Invalid ad fee. Price per day and duration must be greater than 0.');
    }

    // Create payment
    const payment = await this.paymentsService.create({
      paymentType: PaymentType.AD,
      adId: id,
      amount: amountInCents,
      currency: 'USD',
      paymentMethod: paymentData.paymentMethod,
      transactionId: paymentData.transactionId,
      paidBy: paymentData.paidBy || 'ADMIN',
      processedBy: paymentData.processedBy || 'ADMIN',
      notes: paymentData.notes,
    });

    // Update ad status to PUBLISHED
    const updatedAd = await this.prisma.ad.update({
      where: { id },
      data: {
        status: AdStatusEnum.PUBLISHED,
      },
    });

    // Emit event for realtime update
    this.eventEmitter.emit('ad.updated', updatedAd);
    this.logger.log(`✅ Payment processed for ad ${id}, status updated to PUBLISHED`);

    return {
      payment,
      ad: this.transformAd(updatedAd),
    };
  }
}

