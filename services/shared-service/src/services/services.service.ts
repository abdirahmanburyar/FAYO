import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async findByIds(ids: string[]) {
    return this.prisma.service.findMany({
      where: { 
        id: { in: ids },
        isActive: true 
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(createServiceDto: CreateServiceDto) {
    // Check if service with same name already exists
    const existingService = await this.prisma.service.findFirst({
      where: { name: createServiceDto.name },
    });

    if (existingService) {
      throw new ConflictException('Service with this name already exists');
    }

    return this.prisma.service.create({
      data: createServiceDto,
    });
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    const service = await this.findOne(id);

    // Check if name is being updated and if it conflicts
    if (updateServiceDto.name && updateServiceDto.name !== service.name) {
      const existingService = await this.prisma.service.findFirst({
        where: { 
          name: updateServiceDto.name,
          id: { not: id }
        },
      });

      if (existingService) {
        throw new ConflictException('Service with this name already exists');
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.service.delete({
      where: { id },
    });
  }
}
