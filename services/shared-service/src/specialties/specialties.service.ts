import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSpecialtyDto, UpdateSpecialtyDto } from './dto';
import { Specialty } from './entities/specialty.entity';

@Injectable()
export class SpecialtiesService {
  constructor(private prisma: PrismaService) {}

  async create(createSpecialtyDto: CreateSpecialtyDto): Promise<Specialty> {
    try {
      // Check if specialty already exists
      const existingSpecialty = await this.prisma.specialty.findUnique({
        where: { name: createSpecialtyDto.name },
      });

      if (existingSpecialty) {
        throw new ConflictException('Specialty with this name already exists');
      }

      // Ensure isActive has a default value if not provided
      const data = {
        name: createSpecialtyDto.name,
        description: createSpecialtyDto.description || null,
        isActive: createSpecialtyDto.isActive !== undefined ? createSpecialtyDto.isActive : true,
      };

      return await this.prisma.specialty.create({
        data,
      });
    } catch (error) {
      // If it's already a NestJS exception, re-throw it
      if (error instanceof ConflictException) {
        throw error;
      }
      
      // Handle Prisma unique constraint errors
      if (error.code === 'P2002') {
        throw new ConflictException('Specialty with this name already exists');
      }
      
      // Log and re-throw other errors
      console.error('Error creating specialty:', error);
      throw error;
    }
  }

  async findAll(): Promise<Specialty[]> {
    return this.prisma.specialty.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findAllWithInactive(): Promise<Specialty[]> {
    return this.prisma.specialty.findMany({
      orderBy: { name: 'asc' },
    });
  }


  async findOne(id: string): Promise<Specialty> {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id },
    });

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    return specialty;
  }

  async findByIds(ids: string[]): Promise<Specialty[]> {
    return this.prisma.specialty.findMany({
      where: { 
        id: { in: ids },
        isActive: true 
      },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, updateSpecialtyDto: UpdateSpecialtyDto): Promise<Specialty> {
    // Check if specialty exists
    const existingSpecialty = await this.prisma.specialty.findUnique({
      where: { id },
    });

    if (!existingSpecialty) {
      throw new NotFoundException('Specialty not found');
    }

    // Check if name is being changed and if it conflicts
    if (updateSpecialtyDto.name && updateSpecialtyDto.name !== existingSpecialty.name) {
      const nameConflict = await this.prisma.specialty.findUnique({
        where: { name: updateSpecialtyDto.name },
      });

      if (nameConflict) {
        throw new ConflictException('Specialty with this name already exists');
      }
    }

    return this.prisma.specialty.update({
      where: { id },
      data: updateSpecialtyDto,
    });
  }

  async remove(id: string): Promise<void> {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id },
    });

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    await this.prisma.specialty.delete({
      where: { id },
    });
  }


  async getStats(): Promise<{
    totalSpecialties: number;
    activeSpecialties: number;
    inactiveSpecialties: number;
  }> {
    const [totalSpecialties, activeSpecialties] = await Promise.all([
      this.prisma.specialty.count(),
      this.prisma.specialty.count({ where: { isActive: true } }),
    ]);

    return {
      totalSpecialties,
      activeSpecialties,
      inactiveSpecialties: totalSpecialties - activeSpecialties,
    };
  }
}
