import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CreateAdDto, AdStatusEnum } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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
        status: createAdDto.status
            ? (createAdDto.status as any)
            : AdStatusEnum.PENDING,
        createdBy: createAdDto.createdBy,
      },
    });

    // Emit event for realtime update
    this.eventEmitter.emit('ad.created', ad);
    this.logger.log(`✅ Ad created: ${ad.id}`);

    return ad;
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

    return {
      data,
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

    return {
      data,
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

    return ad;
  }

  async update(id: string, updateAdDto: UpdateAdDto) {
    const existingAd = await this.findOne(id);

    const updateData: any = { ...updateAdDto };
    
    // Map adType to type for database
    if (updateAdDto.adType !== undefined) {
      updateData.type = updateAdDto.adType;
      delete updateData.adType;
    }
    
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

    return ad;
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
      }
      
      return ad || { id, success: true };
    } catch (error) {
      this.logger.error(`Failed to increment click count for ad ${id}:`, error);
      throw error;
    }
  }

  /**
   * Calculate ad fee based on price per day and duration
   * @param range Number of days
   * @param price Price per day in cents
   * @returns Fee in cents (price × range)
   */
  calculateAdFee(range: number, price: number): number {
    // Validate inputs
    const validRange = Math.max(1, Math.floor(range || 1));
    const validPrice = Math.max(1, Math.floor(price || 0));
    
    // Calculate: price per day × number of days
    return validPrice * validRange;
  }

}

