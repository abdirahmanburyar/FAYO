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
      const params = new URLSearchParams();
      if (includeInactive) params.append('includeInactive', 'true');

      const url = `${API_CONFIG.SHARED_SERVICE_URL}/api/v1/specialties${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔍 [SPECIALTIES_API] Fetching specialties from:', url);
      
      // Use a longer timeout for the actual request (10 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log('📡 [SPECIALTIES_API] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [SPECIALTIES_API] Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(errorData.message || `Failed to fetch specialties: ${response.status} ${response.statusText}`);
      }

      const specialties = await response.json();
      console.log('✅ [SPECIALTIES_API] Successfully fetched specialties:', specialties?.length || 0);
      return specialties;
    } catch (error) {
      console.error('❌ [SPECIALTIES_API] Error fetching specialties:', error);
      
      // Provide a more user-friendly error message
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        throw new Error('Request timed out. Please check if the shared service is running and try again.');
      }
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        throw new Error('Cannot connect to shared service. Please check your network connection and ensure the service is running.');
      }
      
      throw error;
    }
  }

  async getSpecialtyById(id: string): Promise<Specialty> {
    try {
      const response = await fetch(`${API_CONFIG.SHARED_SERVICE_URL}/api/v1/specialties/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
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
      const response = await fetch(`${API_CONFIG.SHARED_SERVICE_URL}/api/v1/specialties/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch specialty stats: ${response.statusText}`);
      }

      return await response.json();
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

  async updateSpecialty(id: string, specialtyData: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<Specialty> {
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

  // Helper method to get specialties formatted for SelectOption
  async getSpecialtiesForSelect(): Promise<Array<{ value: string; label: string }>> {
    try {
      const specialties = await this.getSpecialties();
      // Filter only active specialties and format for select
      return specialties
        .filter(specialty => specialty.isActive)
        .map(specialty => ({
          value: specialty.id,
          label: specialty.name,
        }));
    } catch (error) {
      console.error('❌ [SPECIALTIES_API] Error getting specialties for select:', error);
      // Don't use fallback - specialties must come from database
      throw error;
    }
  }
}

export const specialtiesApi = new SpecialtiesApiService();
