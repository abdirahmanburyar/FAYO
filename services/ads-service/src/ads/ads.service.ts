import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { AdStatus, AdType } from '@prisma/client';
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
    endDate.setDate(endDate.getDate() + createAdDto.days);
    
    // Auto-determine status based on dates
    const now = new Date();
    let status = AdStatus.PENDING;
    if (startDate <= now && endDate >= now) {
      status = AdStatus.ACTIVE;
    } else if (endDate < now) {
      status = AdStatus.EXPIRED;
    }

    const ad = await this.prisma.ad.create({
      data: {
        image: createAdDto.image,
        startDate,
        endDate,
        days: createAdDto.days,
        status,
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
    
    // Auto-update status based on dates before querying
    await this.updateExpiredAds(now);
    
    if (activeOnly) {
      where.status = AdStatus.ACTIVE;
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    }

    // Ensure reasonable limits to prevent overload
    const take = Math.min(Math.max(1, limit), 100); // Max 100 items per page
    const skip = Math.max(0, (page - 1) * take);

    const [data, total] = await Promise.all([
      this.prisma.ad.findMany({
        where,
        orderBy: [
          { createdAt: 'desc' },
        ],
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
    
    // Auto-update status based on dates before querying
    await this.updateExpiredAds(now);
    
    // Ensure reasonable limits to prevent overload
    const take = Math.min(Math.max(1, limit), 100); // Max 100 items per page
    const skip = Math.max(0, (page - 1) * take);

    const [data, total] = await Promise.all([
      this.prisma.ad.findMany({
        where: {
          status: AdStatus.ACTIVE,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
        take,
        skip,
      }),
      this.prisma.ad.count({
        where: {
          status: AdStatus.ACTIVE,
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
    
    // Calculate endDate if startDate or days changed
    let startDate = existingAd.startDate;
    let days = existingAd.days;
    
    if (updateAdDto.startDate) {
      startDate = new Date(updateAdDto.startDate);
      updateData.startDate = startDate;
    }
    if (updateAdDto.days !== undefined) {
      days = updateAdDto.days;
      updateData.days = days;
    }
    
    // Recalculate endDate
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    updateData.endDate = endDate;
    
    // Auto-update status based on new dates
    const now = new Date();
    if (startDate <= now && endDate >= now) {
      updateData.status = AdStatus.ACTIVE;
    } else if (endDate < now) {
      updateData.status = AdStatus.EXPIRED;
    } else {
      updateData.status = AdStatus.PENDING;
    }

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
        select: {
          id: true,
          image: true,
          clickCount: true,
          viewCount: true,
          status: true,
        },
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

  // Helper method to update expired ads
  private async updateExpiredAds(now: Date) {
    try {
      await this.prisma.$executeRaw`
        UPDATE ads.ads 
        SET status = 'EXPIRED', "updatedAt" = NOW()
        WHERE status IN ('ACTIVE', 'PENDING')
        AND "endDate" < ${now}
      `;
    } catch (error) {
      this.logger.error('Failed to update expired ads:', error);
    }
  }
}

