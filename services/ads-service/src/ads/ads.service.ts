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

  async findAll(activeOnly: boolean = false) {
    const where: any = {};
    
    if (activeOnly) {
      const now = new Date();
      where.status = AdStatus.ACTIVE;
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    }

    return this.prisma.ad.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findActive() {
    const now = new Date();
    return this.prisma.ad.findMany({
      where: {
        status: AdStatus.ACTIVE,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
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
    return this.prisma.ad.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  async incrementClickCount(id: string) {
    const ad = await this.prisma.ad.update({
      where: { id },
      data: {
        clickCount: { increment: 1 },
      },
    });

    // Emit event for realtime update
    this.eventEmitter.emit('ad.clicked', ad);
    
    return ad;
  }
}

