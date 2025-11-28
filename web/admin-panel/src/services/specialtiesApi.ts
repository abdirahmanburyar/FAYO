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

// Specialty Service URL - use Next.js API proxy routes for client-side calls
const getSpecialtyServiceUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Client-side: use Next.js API proxy route (avoids CORS and ensures correct routing)
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/v1/specialties`;
  } else {
    // Server-side: use environment variable or Docker service name
    return process.env.SPECIALTY_SERVICE_URL || 'http://specialty-service:3004';
  }
};

class SpecialtiesApiService {
  private getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getSpecialties(includeInactive?: boolean): Promise<Specialty[]> {
    try {
      const queryParams = includeInactive ? '?includeInactive=true' : '';
      const baseUrl = getSpecialtyServiceUrl();
      const url = typeof window !== 'undefined' 
        ? `${baseUrl}${queryParams}`
        : `${baseUrl}/api/v1/specialties${queryParams}`;
      
      console.log('[SpecialtiesApi] Fetching specialties from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      console.log('[SpecialtiesApi] Response status:', response.status, response.statusText);
      console.log('[SpecialtiesApi] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData: any = {};
        let errorText = '';
        
        try {
          // Try to get response as text first to see what we're dealing with
          const responseText = await response.clone().text();
          console.log('[SpecialtiesApi] Raw error response text:', responseText);
          
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              errorData = JSON.parse(responseText);
            } catch (jsonError) {
              console.error('[SpecialtiesApi] Failed to parse JSON:', jsonError);
              errorText = responseText;
            }
          } else {
            errorText = responseText;
            console.error('[SpecialtiesApi] Non-JSON error response:', errorText);
          }
        } catch (parseError) {
          console.error('[SpecialtiesApi] Failed to parse error response:', parseError);
          errorText = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        const errorMessage = errorData?.message || errorText || `Failed to fetch specialties: ${response.status} ${response.statusText}`;
        console.error('[SpecialtiesApi] Error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorText,
          url,
          hasErrorData: !!errorData && Object.keys(errorData).length > 0
        });
        throw new Error(errorMessage);
      }

      const specialties = await response.json();
      console.log('[SpecialtiesApi] Received specialties:', specialties.length, specialties);

      // Filter inactive if needed
      if (!includeInactive) {
        const activeSpecialties = specialties.filter((s: Specialty) => s.isActive);
        console.log('[SpecialtiesApi] Active specialties:', activeSpecialties.length);
        return activeSpecialties;
      }

      return specialties;
    } catch (error) {
      console.error('[SpecialtiesApi] Error fetching specialties:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to specialty-service. Please ensure it's running on port 3004. Original error: ${error.message}`);
      }
      throw error;
    }
  }

  async getSpecialtyById(id: string): Promise<Specialty> {
    try {
      const baseUrl = getSpecialtyServiceUrl();
      const url = typeof window !== 'undefined'
        ? `${baseUrl}/${id}`
        : `${baseUrl}/api/v1/specialties/${id}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

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
      const baseUrl = getSpecialtyServiceUrl();
      const url = typeof window !== 'undefined'
        ? baseUrl
        : `${baseUrl}/api/v1/specialties`;
      const response = await fetch(url, {
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
      const baseUrl = getSpecialtyServiceUrl();
      const url = typeof window !== 'undefined'
        ? `${baseUrl}/${id}`
        : `${baseUrl}/api/v1/specialties/${id}`;
      const response = await fetch(url, {
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
      console.error('Error updating specialty:', error);
      throw error;
    }
  }

  async deleteSpecialty(id: string): Promise<void> {
    try {
      const baseUrl = getSpecialtyServiceUrl();
      const url = typeof window !== 'undefined'
        ? `${baseUrl}/${id}`
        : `${baseUrl}/api/v1/specialties/${id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

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
