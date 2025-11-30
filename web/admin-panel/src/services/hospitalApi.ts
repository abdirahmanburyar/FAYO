import { API_CONFIG } from '@/config/api';

// Define interfaces for Hospital and Doctor
export interface Hospital {
  id: string;
  name: string;
  type: 'HOSPITAL' | 'CLINIC';
  address: string;
  city: string;
  phone?: string;
  email?: string;
  website?: string;
  bookingPolicy?: 'HOSPITAL_ASSIGNED' | 'DIRECT_DOCTOR';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  doctors?: Doctor[];
  specialties?: HospitalSpecialty[];
  services?: HospitalService[];
}

export interface HospitalSpecialty {
  id: string;
  hospitalId: string;
  specialtyId: string;
  specialtyName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}


export interface HospitalService {
  id: string;
  hospitalId: string;
  serviceId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  hospitalId?: string;
  specialty: string;
  licenseNumber: string;
  experience: number;
  isVerified: boolean;
  isAvailable: boolean;
  consultationFee?: number;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  hospital?: Hospital;
}


// DTOs for creation
export interface CreateHospitalDto {
  userId?: string; // Reference to user account in user-service
  name: string;
  type: 'HOSPITAL' | 'CLINIC';
  address: string;
  city: string;
  phone?: string;
  email?: string;
  website?: string;
  bookingPolicy?: 'HOSPITAL_ASSIGNED' | 'DIRECT_DOCTOR';
  isActive?: boolean;
}

export interface UpdateHospitalDto {
  name?: string;
  type?: 'HOSPITAL' | 'CLINIC';
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  bookingPolicy?: 'HOSPITAL_ASSIGNED' | 'DIRECT_DOCTOR';
  isActive?: boolean;
}

class HospitalApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Get all hospitals
  async getHospitals(): Promise<Hospital[]> {
    try {
      // Try using Next.js API proxy route first (server-side, avoids CORS)
      const proxyUrl = '/api/v1/hospitals';
      console.log('Fetching hospitals from proxy:', proxyUrl);
      
      let response;
      try {
        response = await fetch(proxyUrl, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });
      } catch (proxyError: any) {
        // If proxy fails, try direct connection
        console.warn('Proxy failed, trying direct connection:', proxyError.message);
        const directUrl = `${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}`;
        console.log('Fetching hospitals from direct URL:', directUrl);
        response = await fetch(directUrl, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });
      }

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }
        console.error('Error response data:', errorData);
        throw new Error(errorData.message || `Failed to fetch hospitals: ${response.status} ${response.statusText}`);
      }

      const hospitalsData = await response.json();
      console.log('Hospitals data received:', hospitalsData);
      
      // Handle paginated response (if service returns { data: [], total: number })
      const hospitalsArray = Array.isArray(hospitalsData) 
        ? hospitalsData 
        : (hospitalsData.data || hospitalsData.hospitals || []);
      
      // Ensure we have an array
      if (!Array.isArray(hospitalsArray)) {
        console.error('Hospitals data is not an array:', hospitalsData);
        throw new Error('Invalid response format: expected array of hospitals');
      }
      
      // Transform service data for each hospital
      const transformedHospitals = hospitalsArray.map((hospital: any) => ({
        ...hospital,
        services: hospital.services?.map((service: any) => ({
          id: service.id,
          hospitalId: service.hospitalId,
          serviceId: service.serviceId,
          name: service.name || service.serviceName,
          description: service.description,
          isActive: service.isActive,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
        })) || [],
      }));
      
      console.log('Transformed hospitals:', transformedHospitals);
      return transformedHospitals;
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      throw error;
    }
  }

  // Get hospital by ID
  async getHospitalById(id: string): Promise<Hospital> {
    try {
      // Try proxy route first
      let response;
      try {
        response = await fetch(`/api/v1/hospitals/${id}`, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });
      } catch (proxyError: any) {
        // Fallback to direct connection
        console.warn('Proxy failed, trying direct connection:', proxyError.message);
        response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}/${id}`, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch hospital: ${response.statusText}`);
      }

      const hospitalData = await response.json();
      console.log('🔍 Raw Hospital Data from Backend:', hospitalData);
      console.log('🔍 Raw Services Data:', hospitalData.services);
      
      // Transform service data to match frontend interfaces
      const transformedHospital = {
        ...hospitalData,
        services: hospitalData.services?.map((service: any) => ({
          id: service.id,
          hospitalId: service.hospitalId,
          serviceId: service.serviceId,
          name: service.name || service.serviceName,
          description: service.description,
          isActive: service.isActive,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
        })) || [],
      };

      console.log('🔄 Transformed Hospital Data:', transformedHospital);
      console.log('🔄 Transformed Services:', transformedHospital.services);

      return transformedHospital;
    } catch (error) {
      console.error('Error fetching hospital:', error);
      throw error;
    }
  }

  // Alias for getHospitalById
  async getHospital(id: string): Promise<Hospital> {
    return this.getHospitalById(id);
  }

  // Create new hospital
  async createHospital(hospitalData: CreateHospitalDto): Promise<Hospital> {
    try {
      // Try proxy route first
      let response;
      try {
        response = await fetch('/api/v1/hospitals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(hospitalData),
        });
      } catch (proxyError: any) {
        // Fallback to direct connection
        console.warn('Proxy failed, trying direct connection:', proxyError.message);
        response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(hospitalData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create hospital: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating hospital:', error);
      throw error;
    }
  }

  // Update hospital
  async updateHospital(id: string, hospitalData: UpdateHospitalDto): Promise<Hospital> {
    try {
      console.log('🏥 Updating hospital:', { id, hospitalData });
      console.log('🏥 Auth headers:', this.getAuthHeaders());
      
      // Try proxy route first
      let response;
      try {
        response = await fetch(`/api/v1/hospitals/${id}`, {
          method: 'PATCH',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(hospitalData),
        });
      } catch (proxyError: any) {
        // Fallback to direct connection
        console.warn('Proxy failed, trying direct connection:', proxyError.message);
        response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}/${id}`, {
          method: 'PATCH',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(hospitalData),
        });
      }

      console.log('🏥 Update response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🏥 Update error:', errorData);
        throw new Error(errorData.message || `Failed to update hospital: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🏥 Update success:', result);
      return result;
    } catch (error) {
      console.error('Error updating hospital:', error);
      throw error;
    }
  }

  // Delete hospital
  async deleteHospital(id: string): Promise<void> {
    try {
      // Try proxy route first
      let response;
      try {
        response = await fetch(`/api/v1/hospitals/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        });
      } catch (proxyError: any) {
        // Fallback to direct connection
        console.warn('Proxy failed, trying direct connection:', proxyError.message);
        response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete hospital: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting hospital:', error);
      throw error;
    }
  }

  // Get hospital statistics
  async getHospitalStats(): Promise<{
    totalHospitals: number;
    activeHospitals: number;
    inactiveHospitals: number;
    totalCities: number;
    totalDoctors: number;
  }> {
    try {
      const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch hospital stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching hospital stats:', error);
      throw error;
    }
  }

  // Get all doctors
  async getDoctors(): Promise<Doctor[]> {
    try {
      const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}/api/v1/doctors`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch doctors: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  }

  // Get all clinics
  async getClinics(): Promise<Hospital[]> {
    try {
      const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}/api/v1/clinics`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch clinics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching clinics:', error);
      throw error;
    }
  }
}

export const hospitalApi = new HospitalApiService();
