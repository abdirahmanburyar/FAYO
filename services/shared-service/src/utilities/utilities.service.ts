import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UtilitiesService {
  constructor(private prisma: PrismaService) {}

  // Countries
  async getCountries() {
    return this.prisma.country.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  // Cities
  async getCities(countryId?: string) {
    return this.prisma.city.findMany({
      where: { 
        isActive: true,
        ...(countryId && { countryId })
      },
      orderBy: { name: 'asc' },
    });
  }

  // Settings
  async getSettings() {
    return this.prisma.setting.findMany({
      where: { isActive: true },
      orderBy: { key: 'asc' },
    });
  }

  async getSetting(key: string) {
    return this.prisma.setting.findUnique({
      where: { key },
    });
  }

  async setSetting(key: string, value: string, type: string = 'string') {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value, type },
      create: { key, value, type },
    });
  }



  // Services
  async getServices() {
    return this.prisma.service.findMany({
      where: { 
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  // Specialties
  async getSpecialties() {
    return this.prisma.specialty.findMany({
      where: { 
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  // Get all reference data
  async getAllReferenceData() {
    const [countries, cities, services, specialties] = await Promise.all([
      this.prisma.country.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.city.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.service.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.specialty.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      countries,
      cities,
      services,
      specialties,
    };
  }
}