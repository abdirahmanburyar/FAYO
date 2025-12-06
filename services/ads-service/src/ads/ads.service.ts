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
    const ad = await this.prisma.ad.create({
      data: {
        ...createAdDto,
        startDate: new Date(createAdDto.startDate),
        endDate: new Date(createAdDto.endDate),
      },
    });

    // Emit event for realtime update
    this.eventEmitter.emit('ad.created', ad);
    this.logger.log(`✅ Ad created: ${ad.id}`);

    return ad;
  }

  async findAll(activeOnly: boolean = false, page: number = 1, limit: number = 50) {
    const where: any = {};
    
    if (activeOnly) {
      const now = new Date();
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
          { priority: 'desc' },
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
          { priority: 'desc' },
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
    
    if (updateAdDto.startDate) {
      updateData.startDate = new Date(updateAdDto.startDate);
    }
    if (updateAdDto.endDate) {
      updateData.endDate = new Date(updateAdDto.endDate);
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
          title: true,
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
}

