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

  async getSpecialties(includeInactive?: boolean): Promise<Specialty[]> {
    try {
      // Try using Next.js API proxy route first (server-side, avoids CORS)
      const proxyUrl = `/api/v1/specialties${includeInactive ? '?includeInactive=true' : ''}`;
      console.log('[SpecialtiesApi] Fetching specialties from proxy:', proxyUrl);
      
      let response;
      try {
        response = await fetch(proxyUrl, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });
      } catch (proxyError: any) {
        // If proxy fails, try direct connection
        console.warn('Proxy failed, trying direct connection:', proxyError.message);
        const specialtyServiceUrl = API_CONFIG.SPECIALTY_SERVICE_URL;
        const directUrl = `${specialtyServiceUrl}/api/v1/specialties${includeInactive ? '?includeInactive=true' : ''}`;
        console.log('[SpecialtiesApi] Fetching specialties from direct URL:', directUrl);
        response = await fetch(directUrl, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });
      }

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
      throw error;
    }
  }

  async getSpecialtyById(id: string): Promise<Specialty> {
    try {
      // Try proxy route first
      let response;
      try {
        response = await fetch(`/api/v1/specialties/${id}`, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });
      } catch (proxyError: any) {
        // Fallback to direct connection
        console.warn('Proxy failed, trying direct connection:', proxyError.message);
        const specialtyServiceUrl = API_CONFIG.SPECIALTY_SERVICE_URL;
        response = await fetch(`${specialtyServiceUrl}/api/v1/specialties/${id}`, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch specialty: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching specialty:', error);
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
      // Try proxy route first
      let response;
      try {
        response = await fetch('/api/v1/specialties', {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(specialtyData),
        });
      } catch (proxyError: any) {
        // Fallback to direct connection
        console.warn('Proxy failed, trying direct connection:', proxyError.message);
        const specialtyServiceUrl = API_CONFIG.SPECIALTY_SERVICE_URL;
        response = await fetch(`${specialtyServiceUrl}/api/v1/specialties`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(specialtyData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create specialty: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating specialty:', error);
      throw error;
    }
  }

  async updateSpecialty(id: string, specialtyData: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<Specialty> {
    try {
      // Try proxy route first
      let response;
      try {
        response = await fetch(`/api/v1/specialties/${id}`, {
          method: 'PATCH',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(specialtyData),
        });
      } catch (proxyError: any) {
        // Fallback to direct connection
        console.warn('Proxy failed, trying direct connection:', proxyError.message);
        const specialtyServiceUrl = API_CONFIG.SPECIALTY_SERVICE_URL;
        response = await fetch(`${specialtyServiceUrl}/api/v1/specialties/${id}`, {
          method: 'PATCH',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(specialtyData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
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
      // Try proxy route first
      let response;
      try {
        response = await fetch(`/api/v1/specialties/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        });
      } catch (proxyError: any) {
        // Fallback to direct connection
        console.warn('Proxy failed, trying direct connection:', proxyError.message);
        const specialtyServiceUrl = API_CONFIG.SPECIALTY_SERVICE_URL;
        response = await fetch(`${specialtyServiceUrl}/api/v1/specialties/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete specialty: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting specialty:', error);
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
