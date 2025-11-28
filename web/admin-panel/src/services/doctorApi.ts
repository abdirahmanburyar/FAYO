import { API_CONFIG } from '@/config/api';

export interface Doctor {
  id: string;
  userId: string; // Reference to user in user-service
  licenseNumber: string;
  experience: number;
  isVerified: boolean;
  isAvailable: boolean;
  selfEmployedConsultationFee?: number;
  bio?: string;
  education?: string;
  certifications?: string; // JSON array string
  languages?: string; // JSON array string
  awards?: string; // JSON array string
  publications?: string; // JSON array string
  memberships?: string; // JSON array string
  researchInterests?: string;
  createdAt: string;
  updatedAt: string;
  specialties: {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }[];
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

export interface CreateDoctorDto {
  userId: string; // ID of the associated user
  specialtyIds: string[];
  licenseNumber: string;
  experience: number;
  isVerified?: boolean;
  isAvailable?: boolean;
  selfEmployedConsultationFee?: number;
  bio?: string;
  education?: string;
  certifications?: string; // JSON array string
  languages?: string; // JSON array string
  awards?: string; // JSON array string
  publications?: string; // JSON array string
  memberships?: string; // JSON array string
  researchInterests?: string;
}

export interface UpdateDoctorDto {
  specialtyIds?: string[];
  licenseNumber?: string;
  experience?: number;
  isVerified?: boolean;
  isAvailable?: boolean;
  selfEmployedConsultationFee?: number | null; // Allow null to clear the fee
  bio?: string;
  education?: string;
  certifications?: string; // JSON array string
  languages?: string; // JSON array string
  awards?: string; // JSON array string
  publications?: string; // JSON array string
  memberships?: string; // JSON array string
  researchInterests?: string;
}

class DoctorApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getDoctors(): Promise<Doctor[]> {
    try {
      console.log('🔍 [DOCTOR_API] Fetching doctors from:', `${API_CONFIG.DOCTOR_SERVICE_URL}${API_CONFIG.ENDPOINTS.DOCTORS}`);
      
      const response = await fetch(`${API_CONFIG.DOCTOR_SERVICE_URL}${API_CONFIG.ENDPOINTS.DOCTORS}`, {
        headers: this.getAuthHeaders(),
      });
      
      console.log('📡 [DOCTOR_API] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [DOCTOR_API] Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(errorData.message || `Failed to fetch doctors: ${response.statusText}`);
      }
      
      const doctors = await response.json();
      console.log('✅ [DOCTOR_API] Successfully fetched doctors:', doctors?.length || 0);
      
      // Ensure we return an array
      return Array.isArray(doctors) ? doctors : [];
    } catch (error) {
      console.error('❌ [DOCTOR_API] Error in getDoctors:', error);
      throw error;
    }
  }

  async getDoctorById(id: string): Promise<Doctor> {
    const response = await fetch(`${API_CONFIG.DOCTOR_SERVICE_URL}${API_CONFIG.ENDPOINTS.DOCTORS}/${id}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch doctor');
    }
    return response.json();
  }

  async createDoctor(doctorData: CreateDoctorDto): Promise<Doctor> {
    try {
      console.log('📝 [DOCTOR_API] Creating doctor:', doctorData);
      
      const response = await fetch(`${API_CONFIG.DOCTOR_SERVICE_URL}${API_CONFIG.ENDPOINTS.DOCTORS}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(doctorData),
      });
      
      console.log('📡 [DOCTOR_API] Create response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [DOCTOR_API] Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `Failed to create doctor: ${response.status} ${response.statusText}` };
        }
        throw new Error(errorData.message || errorData.error || `Failed to create doctor: ${response.status} ${response.statusText}`);
      }
      
      const createdDoctor = await response.json();
      console.log('✅ [DOCTOR_API] Successfully created doctor:', createdDoctor.id);
      return createdDoctor;
    } catch (error) {
      console.error('❌ [DOCTOR_API] Error in createDoctor:', error);
      throw error;
    }
  }

  async updateDoctor(id: string, doctorData: UpdateDoctorDto): Promise<Doctor> {
    try {
      console.log('📝 [DOCTOR_API] Updating doctor:', id, doctorData);
      
      const response = await fetch(`${API_CONFIG.DOCTOR_SERVICE_URL}${API_CONFIG.ENDPOINTS.DOCTORS}/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(doctorData),
      });
      
      console.log('📡 [DOCTOR_API] Update response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [DOCTOR_API] Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `Failed to update doctor: ${response.status} ${response.statusText}` };
        }
        throw new Error(errorData.message || errorData.error || `Failed to update doctor: ${response.status} ${response.statusText}`);
      }
      
      const updatedDoctor = await response.json();
      console.log('✅ [DOCTOR_API] Successfully updated doctor:', updatedDoctor.id);
      return updatedDoctor;
    } catch (error) {
      console.error('❌ [DOCTOR_API] Error in updateDoctor:', error);
      throw error;
    }
  }

  async deleteDoctor(id: string): Promise<void> {
    const response = await fetch(`${API_CONFIG.DOCTOR_SERVICE_URL}${API_CONFIG.ENDPOINTS.DOCTORS}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete doctor');
    }
  }
}

export const doctorApi = new DoctorApiService();
