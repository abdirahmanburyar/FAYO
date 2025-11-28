// Shared service has been removed
// This file is kept for type compatibility but all functions will throw errors

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  id: string;
  name: string;
  countryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpecialtyDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateCountryDto {
  name: string;
  code: string;
  isActive?: boolean;
}

export interface CreateCityDto {
  name: string;
  countryId: string;
  isActive?: boolean;
}

export interface CreateSettingDto {
  key: string;
  value: string;
  type?: string;
  isActive?: boolean;
}

class SharedApiService {
  private throwError() {
    throw new Error('Shared service has been removed. This functionality is no longer available.');
  }

  // Specialties
  async getSpecialties(): Promise<Specialty[]> {
    this.throwError();
  }

  async createSpecialty(specialtyData: CreateSpecialtyDto): Promise<Specialty> {
    this.throwError();
  }

  async updateSpecialty(id: string, specialtyData: Partial<CreateSpecialtyDto>): Promise<Specialty> {
    this.throwError();
  }

  async deleteSpecialty(id: string): Promise<void> {
    this.throwError();
      }

  // Services
  async getServices(): Promise<Service[]> {
    this.throwError();
  }

  async createService(serviceData: CreateServiceDto): Promise<Service> {
    this.throwError();
  }

  async updateService(id: string, serviceData: Partial<CreateServiceDto>): Promise<Service> {
    this.throwError();
  }

  async deleteService(id: string): Promise<void> {
    this.throwError();
  }

  // Countries
  async getCountries(): Promise<Country[]> {
    this.throwError();
  }

  // Cities
  async getCities(): Promise<City[]> {
    this.throwError();
  }

  // Settings
  async getSettings(): Promise<Setting[]> {
    this.throwError();
  }

  async updateSetting(id: string, settingData: Partial<CreateSettingDto>): Promise<Setting> {
    this.throwError();
  }
}

export const sharedApi = new SharedApiService();
