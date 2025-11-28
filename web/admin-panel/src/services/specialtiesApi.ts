import { API_CONFIG } from '@/config/api';

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialtyStats {
  totalSpecialties: number;
  activeSpecialties: number;
  inactiveSpecialties: number;
}

class SpecialtiesApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private isConnectionError(error: any): boolean {
    // Check for common connection error patterns
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorName = error?.name?.toLowerCase() || '';
    
    return (
      errorName === 'typeerror' ||
      errorMessage.includes('failed to fetch') ||
      errorMessage.includes('networkerror') ||
      errorMessage.includes('connection refused') ||
      errorMessage.includes('network request failed') ||
      errorMessage.includes('err_connection_refused')
    );
  }

  private createConnectionError(serviceUrl: string, originalError: any): Error {
    const url = new URL(serviceUrl);
    const port = url.port || (url.protocol === 'https:' ? '443' : '80');
    const serviceName = url.hostname.replace(/\./g, '-');
    
    return new Error(
      `Cannot connect to ${serviceName}. Please ensure it's running on port ${port}. Original error: ${originalError?.message || 'Failed to fetch'}`
    );
  }

  async getSpecialties(includeInactive?: boolean): Promise<Specialty[]> {
    try {
      // Use Next.js API proxy route (server-side, avoids CORS)
      const proxyUrl = `/api/v1/specialties${includeInactive ? '?includeInactive=true' : ''}`;
      console.log('[SpecialtiesApi] Fetching specialties from proxy:', proxyUrl);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      console.log('[SpecialtiesApi] Response status:', response.status);
      console.log('[SpecialtiesApi] Response ok:', response.ok);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }
        console.error('[SpecialtiesApi] Error response data:', errorData);
        throw new Error(errorData.message || `Failed to fetch specialties: ${response.status} ${response.statusText}`);
      }

      const specialties = await response.json();
      console.log('[SpecialtiesApi] Specialties data received:', specialties);
      
      // Handle array response
      const specialtiesArray = Array.isArray(specialties) ? specialties : (specialties.data || specialties.specialties || []);
      
      if (!Array.isArray(specialtiesArray)) {
        console.error('[SpecialtiesApi] Specialties data is not an array:', specialties);
        throw new Error('Invalid response format: expected array of specialties');
      }

      // Filter inactive if needed
      if (!includeInactive) {
        const activeSpecialties = specialtiesArray.filter((s: Specialty) => s.isActive);
        console.log('[SpecialtiesApi] Active specialties:', activeSpecialties.length);
        return activeSpecialties;
      }

      return specialtiesArray;
    } catch (error) {
      console.error('[SpecialtiesApi] Error fetching specialties:', error);
      // If it's already a connection error with our custom message, just re-throw it
      if (error instanceof Error && error.message.includes('Cannot connect to')) {
        throw error;
      }
      // Otherwise, check if it's a connection error and wrap it
      if (this.isConnectionError(error)) {
        const specialtyServiceUrl = API_CONFIG.SPECIALTY_SERVICE_URL;
        throw this.createConnectionError(specialtyServiceUrl, error);
      }
      throw error;
    }
  }

  async getSpecialtyById(id: string): Promise<Specialty> {
    try {
      // Use Next.js API proxy route (server-side, avoids CORS)
      const proxyUrl = `/api/v1/specialties/${id}`;
      console.log('[SpecialtiesApi] Fetching specialty by ID from proxy:', proxyUrl);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch specialty: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[SpecialtiesApi] Error fetching specialty:', error);
      if (error instanceof Error && error.message.includes('Cannot connect to')) {
        throw error;
      }
      if (this.isConnectionError(error)) {
        const specialtyServiceUrl = API_CONFIG.SPECIALTY_SERVICE_URL;
        throw this.createConnectionError(specialtyServiceUrl, error);
      }
      throw error;
    }
  }

  async getStats(): Promise<SpecialtyStats> {
    try {
      const specialties = await this.getSpecialties(true);
      
      return {
        totalSpecialties: specialties.length,
        activeSpecialties: specialties.filter((s: Specialty) => s.isActive).length,
        inactiveSpecialties: specialties.filter((s: Specialty) => !s.isActive).length,
      };
    } catch (error) {
      console.error('Error fetching specialty stats:', error);
      throw error;
    }
  }

  async createSpecialty(specialtyData: {
    name: string;
    description?: string;
    isActive?: boolean;
  }): Promise<Specialty> {
    try {
      // Use Next.js API proxy route (server-side, avoids CORS)
      const proxyUrl = `/api/v1/specialties`;
      console.log('[SpecialtiesApi] Creating specialty via proxy:', proxyUrl);
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(specialtyData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create specialty: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[SpecialtiesApi] Error creating specialty:', error);
      if (error instanceof Error && error.message.includes('Cannot connect to')) {
        throw error;
      }
      if (this.isConnectionError(error)) {
        const specialtyServiceUrl = API_CONFIG.SPECIALTY_SERVICE_URL;
        throw this.createConnectionError(specialtyServiceUrl, error);
      }
      throw error;
    }
  }

  async updateSpecialty(id: string, specialtyData: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<Specialty> {
    try {
      // Use Next.js API proxy route (server-side, avoids CORS)
      const proxyUrl = `/api/v1/specialties/${id}`;
      console.log('[SpecialtiesApi] Updating specialty via proxy:', proxyUrl);
      
      const response = await fetch(proxyUrl, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(specialtyData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update specialty: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[SpecialtiesApi] Error updating specialty:', error);
      if (error instanceof Error && error.message.includes('Cannot connect to')) {
        throw error;
      }
      if (this.isConnectionError(error)) {
        const specialtyServiceUrl = API_CONFIG.SPECIALTY_SERVICE_URL;
        throw this.createConnectionError(specialtyServiceUrl, error);
      }
      throw error;
    }
  }

  async deleteSpecialty(id: string): Promise<void> {
    try {
      // Use Next.js API proxy route (server-side, avoids CORS)
      const proxyUrl = `/api/v1/specialties/${id}`;
      console.log('[SpecialtiesApi] Deleting specialty via proxy:', proxyUrl);
      
      const response = await fetch(proxyUrl, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete specialty: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[SpecialtiesApi] Error deleting specialty:', error);
      if (error instanceof Error && error.message.includes('Cannot connect to')) {
        throw error;
      }
      if (this.isConnectionError(error)) {
        const specialtyServiceUrl = API_CONFIG.SPECIALTY_SERVICE_URL;
        throw this.createConnectionError(specialtyServiceUrl, error);
      }
      throw error;
    }
  }

  async getSpecialtiesForSelect(): Promise<Array<{ value: string; label: string }>> {
    try {
      const specialties = await this.getSpecialties();
      return specialties.map((specialty: Specialty) => ({
          value: specialty.id,
          label: specialty.name,
        }));
    } catch (error) {
      console.error('Error fetching specialties for select:', error);
      throw error;
    }
  }
}

export const specialtiesApi = new SpecialtiesApiService();
