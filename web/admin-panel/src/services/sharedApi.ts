import { API_CONFIG } from '@/config/api';

// Define interfaces for shared data

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

// DTOs for creation

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
  private getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }


  // Specialties
  async getSpecialties(): Promise<Specialty[]> {
    try {
      // Use a longer timeout (10 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_CONFIG.SHARED_SERVICE_URL}/api/v1/specialties`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch specialties: ${response.statusText}` }));
        throw new Error(errorData.message || `Failed to fetch specialties: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching specialties:', error);
      
      // Provide user-friendly error messages
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        throw new Error('Request timed out. Please check if the shared service is running and try again.');
      }
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        throw new Error('Cannot connect to shared service. Please check your network connection and ensure the service is running.');
      }
      
      throw error;
    }
  }

  async createSpecialty(specialtyData: CreateSpecialtyDto): Promise<Specialty> {
    try {
      const response = await fetch(`${API_CONFIG.SHARED_SERVICE_URL}/api/v1/specialties`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(specialtyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create specialty: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating specialty:', error);
      throw error;
    }
  }

  async updateSpecialty(id: string, specialtyData: Partial<CreateSpecialtyDto>): Promise<Specialty> {
    try {
      const response = await fetch(`${API_CONFIG.SHARED_SERVICE_URL}/api/v1/specialties/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(specialtyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update specialty: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating specialty:', error);
      throw error;
    }
  }

  async deleteSpecialty(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.SHARED_SERVICE_URL}/api/v1/specialties/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete specialty: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting specialty:', error);
      throw error;
    }
  }


  // Services
  async getServices(): Promise<Service[]> {
    try {
      const response = await fetch(`${API_CONFIG.SHARED_SERVICE_URL}/api/v1/services`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch services: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  async createService(serviceData: CreateServiceDto): Promise<Service> {
    try {
      const response = await fetch(`${API_CONFIG.SHARED_SERVICE_URL}/api/v1/services`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create service: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  async updateService(id: string, serviceData: Partial<CreateServiceDto>): Promise<Service> {
    try {
      const response = await fetch(`${API_CONFIG.SHARED_SERVICE_URL}/api/v1/services/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update service: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  async deleteService(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.SHARED_SERVICE_URL}/api/v1/services/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete service: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }

  // Countries
  async getCountries(): Promise<Country[]> {
    try {
      const response = await fetch(`${API_CONFIG.SHARED_SERVICE_URL}/api/v1/countries`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch countries: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  }

  // Cities
  async getCities(): Promise<City[]> {
    try {
      const response = await fetch(`${API_CONFIG.SHARED_SERVICE_URL}/api/v1/cities`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch cities: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw error;
    }
  }

  // Settings
  async getSettings(): Promise<Setting[]> {
    try {
      const response = await fetch(`${API_CONFIG.SHARED_SERVICE_URL}/api/v1/settings`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch settings: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  }

  async updateSetting(id: string, settingData: Partial<CreateSettingDto>): Promise<Setting> {
    try {
      const response = await fetch(`${API_CONFIG.SHARED_SERVICE_URL}/api/v1/settings/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(settingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update setting: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  }
}

export const sharedApi = new SharedApiService();
