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
      // First check if shared service is healthy
      await this.checkSharedServiceHealth();
      
      const params = new URLSearchParams();
      if (includeInactive) params.append('includeInactive', 'true');

      const url = `${API_CONFIG.SHARED_SERVICE_URL}/api/v1/specialties${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔍 [SPECIALTIES_API] Fetching specialties from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

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
      throw error;
    }
  }

  private async checkSharedServiceHealth(): Promise<void> {
    try {
      const healthUrl = `${API_CONFIG.SHARED_SERVICE_URL}/api/v1/health`;
      console.log('🔍 [SPECIALTIES_API] Checking shared service health at:', healthUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Shared service health check failed: ${response.status} ${response.statusText}`);
      }
      
      const healthData = await response.json();
      console.log('✅ [SPECIALTIES_API] Shared service is healthy:', healthData);
    } catch (error) {
      console.error('❌ [SPECIALTIES_API] Shared service health check failed:', error);
      throw new Error(`Shared service is not accessible: ${error.message}`);
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
      return specialties.map(specialty => ({
        value: specialty.id,
        label: specialty.name,
      }));
    } catch (error) {
      console.error('❌ [SPECIALTIES_API] Error getting specialties for select:', error);
      
      // Fallback to default specialties if API fails
      console.log('🔄 [SPECIALTIES_API] Using fallback specialties...');
      const fallbackSpecialties = this.getFallbackSpecialties();
      return fallbackSpecialties;
    }
  }

  // Fallback specialties when database is not available
  private getFallbackSpecialties(): Array<{ value: string; label: string }> {
    return [
      { value: 'cardiology', label: 'Cardiology' },
      { value: 'neurology', label: 'Neurology' },
      { value: 'gastroenterology', label: 'Gastroenterology' },
      { value: 'endocrinology', label: 'Endocrinology' },
      { value: 'pulmonology', label: 'Pulmonology' },
      { value: 'nephrology', label: 'Nephrology' },
      { value: 'rheumatology', label: 'Rheumatology' },
      { value: 'hematology', label: 'Hematology' },
      { value: 'oncology', label: 'Oncology' },
      { value: 'infectious-diseases', label: 'Infectious Diseases' },
      { value: 'general-surgery', label: 'General Surgery' },
      { value: 'cardiothoracic-surgery', label: 'Cardiothoracic Surgery' },
      { value: 'neurosurgery', label: 'Neurosurgery' },
      { value: 'orthopedic-surgery', label: 'Orthopedic Surgery' },
      { value: 'plastic-surgery', label: 'Plastic Surgery' },
      { value: 'pediatric-surgery', label: 'Pediatric Surgery' },
      { value: 'vascular-surgery', label: 'Vascular Surgery' },
      { value: 'urological-surgery', label: 'Urological Surgery' },
      { value: 'gynecological-surgery', label: 'Gynecological Surgery' },
      { value: 'ophthalmological-surgery', label: 'Ophthalmological Surgery' },
      { value: 'pediatric-cardiology', label: 'Pediatric Cardiology' },
      { value: 'pediatric-neurology', label: 'Pediatric Neurology' },
      { value: 'neonatology', label: 'Neonatology' },
      { value: 'pediatric-gastroenterology', label: 'Pediatric Gastroenterology' },
      { value: 'pediatric-endocrinology', label: 'Pediatric Endocrinology' },
      { value: 'psychiatry', label: 'Psychiatry' },
      { value: 'psychology', label: 'Psychology' },
      { value: 'dermatology', label: 'Dermatology' },
      { value: 'ophthalmology', label: 'Ophthalmology' },
      { value: 'otolaryngology', label: 'Otolaryngology (ENT)' },
      { value: 'anesthesiology', label: 'Anesthesiology' },
      { value: 'radiology', label: 'Radiology' },
      { value: 'pathology', label: 'Pathology' },
      { value: 'emergency-medicine', label: 'Emergency Medicine' },
      { value: 'family-medicine', label: 'Family Medicine' },
      { value: 'internal-medicine', label: 'Internal Medicine' },
      { value: 'pediatrics', label: 'Pediatrics' },
      { value: 'obstetrics-gynecology', label: 'Obstetrics & Gynecology' },
      { value: 'urology', label: 'Urology' },
      { value: 'orthopedics', label: 'Orthopedics' },
    ];
  }
}

export const specialtiesApi = new SpecialtiesApiService();
