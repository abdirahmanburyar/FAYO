import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';

@Injectable()
export class SpecialtiesService {
  constructor(private prisma: PrismaService) {}

  async create(createSpecialtyDto: CreateSpecialtyDto) {
    try {
      // Check if specialty with same name already exists
      const existing = await this.prisma.specialty.findUnique({
        where: { name: createSpecialtyDto.name },
      });

      if (existing) {
        throw new ConflictException(`Specialty with name "${createSpecialtyDto.name}" already exists`);
      }

      return await this.prisma.specialty.create({
        data: {
          name: createSpecialtyDto.name,
          description: createSpecialtyDto.description,
          isActive: createSpecialtyDto.isActive ?? true,
        },
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new ConflictException(`Specialty with name "${createSpecialtyDto.name}" already exists`);
      }
      throw error;
    }
  }

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    
    return await this.prisma.specialty.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id },
    });

    if (!specialty) {
      throw new NotFoundException(`Specialty with ID ${id} not found`);
    }

    return specialty;
  }

  async findByName(name: string) {
    const specialty = await this.prisma.specialty.findUnique({
      where: { name },
    });

    if (!specialty) {
      throw new NotFoundException(`Specialty with name "${name}" not found`);
    }

    return specialty;
  }

  async update(id: string, updateSpecialtyDto: UpdateSpecialtyDto) {
    try {
      // Check if specialty exists
      const existing = await this.prisma.specialty.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Specialty with ID ${id} not found`);
      }

      // If name is being updated, check for conflicts
      if (updateSpecialtyDto.name && updateSpecialtyDto.name !== existing.name) {
        const nameConflict = await this.prisma.specialty.findUnique({
          where: { name: updateSpecialtyDto.name },
        });

        if (nameConflict) {
          throw new ConflictException(`Specialty with name "${updateSpecialtyDto.name}" already exists`);
        }
      }

      return await this.prisma.specialty.update({
        where: { id },
        data: updateSpecialtyDto,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Specialty with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException(`Specialty with name "${updateSpecialtyDto.name}" already exists`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.specialty.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Specialty with ID ${id} not found`);
      }
      throw error;
    }
  }

  async getStats() {
    const [total, active, inactive] = await Promise.all([
      this.prisma.specialty.count(),
      this.prisma.specialty.count({ where: { isActive: true } }),
      this.prisma.specialty.count({ where: { isActive: false } }),
    ]);

    return {
      totalSpecialties: total,
      activeSpecialties: active,
      inactiveSpecialties: inactive,
    };
  }
}

