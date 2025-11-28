import { API_CONFIG } from '@/config/api';
import { Doctor } from '@/services/hospitalApi';

// Types

export interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
  duration?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HospitalDoctor {
  id: string;
  doctorId: string;
  hospitalId: string;
  role: string;
  shift?: string;
  startTime?: string;
  endTime?: string;
  consultationFee?: number;
  status?: string;
  isActive?: boolean;
  joinedAt: string;
  leftAt?: string;
  createdAt: string;
  updatedAt: string;
  doctor: {
    id: string;
    userId: string;
    specialty?: string;
    specialties?: Array<{ id: string; name: string }>;
    licenseNumber: string;
    experience: number;
    isVerified: boolean;
    isAvailable: boolean;
    consultationFee?: number;
    bio?: string;
    createdAt: string;
    updatedAt: string;
    user?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    };
  };
}

export interface AddServiceRequest {
  serviceId: string;
  serviceName: string;
  description?: string;
  price?: number;
  duration?: number;
}

export interface AddDoctorRequest {
  doctorId: string;
  role?: string;
  shift?: string; // e.g., "MORNING", "AFTERNOON", "EVENING", "NIGHT", "FULL_DAY"
  startTime?: string; // Time format: "09:00" (24-hour format)
  endTime?: string; // Time format: "17:00" (24-hour format)
  consultationFee?: number; // Consultation fee in USD (will be converted to cents)
  status?: string; // ACTIVE, INACTIVE
}

export interface UpdateServiceRequest {
  serviceName?: string;
  description?: string;
  price?: number;
  duration?: number;
  isActive?: boolean;
}

export interface UpdateDoctorRequest {
  role?: string;
  isActive?: boolean;
}

export interface UpdateDoctorRoleRequest {
  role: string;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};


// Hospital Services API
export const hospitalServicesApi = {
  // Get all services for a hospital
  getServices: async (hospitalId: string): Promise<Service[]> => {
    try {
      const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}/${hospitalId}/services`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch services: ${response.statusText}`);
      }

      const hospitalServices = await response.json();
      
      // Transform hospital service data to match Service interface
      return hospitalServices.map((service: any) => ({
        id: service.id, // Use the hospital service ID
        name: service.serviceName,
        description: '', // Hospital services don't have descriptions
        isActive: service.isActive,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      }));
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  // Add service to hospital
  addService: async (hospitalId: string, data: AddServiceRequest): Promise<Service> => {
    try {
      const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}/${hospitalId}/services`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ serviceId: data.serviceId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to add service: ${response.statusText}`);
      }

      const hospitalService = await response.json();
      
      // Transform response to match Service interface
      return {
        id: hospitalService.id,
        name: hospitalService.serviceName,
        description: '',
        isActive: hospitalService.isActive,
        createdAt: hospitalService.createdAt,
        updatedAt: hospitalService.updatedAt,
      };
    } catch (error) {
      console.error('Error adding service:', error);
      throw error;
    }
  },

  // Update service
  updateService: async (
    hospitalId: string, 
    serviceId: string, 
    data: UpdateServiceRequest
  ): Promise<Service> => {
    try {
      const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}/${hospitalId}/services/${serviceId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
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
  },

  // Remove service from hospital
  removeService: async (hospitalId: string, serviceId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}/${hospitalId}/services/${serviceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to remove service: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error removing service:', error);
      throw error;
    }
  },

  // Toggle service status
  toggleServiceStatus: async (hospitalId: string, serviceId: string, isActive: boolean): Promise<Service> => {
    try {
      const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}/${hospitalId}/services/${serviceId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to toggle service status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error toggling service status:', error);
      throw error;
    }
  }
};


// Available services and doctors for selection
export const hospitalManagementApi = {

  // Get available services (shared service removed)
  getAvailableServices: async (): Promise<Array<{ id: string; name: string; description?: string }>> => {
    // Shared service has been removed - return empty array
    console.warn('Shared service has been removed. Services functionality is no longer available.');
    return [];
  },

  // Get available doctors (from doctor service), excluding those already associated with the hospital
  getAvailableDoctors: async (hospitalId?: string): Promise<Array<{ id: string; firstName: string; lastName: string; specialty: string }>> => {
    try {
      const response = await fetch(`${API_CONFIG.DOCTOR_SERVICE_URL}${API_CONFIG.ENDPOINTS.DOCTORS}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch doctors: ${response.statusText}`);
      }

      const doctors = await response.json();
      
      // Transform doctor data to match expected format
      let availableDoctors = doctors.map((doctor: any) => ({
        id: doctor.id,
        firstName: doctor.user?.firstName || 'Unknown',
        lastName: doctor.user?.lastName || 'Doctor',
        specialty: doctor.specialties?.map((s: any) => s.name).join(', ') || 'General'
      }));

      // If hospitalId is provided, filter out doctors already associated with this hospital
      if (hospitalId) {
        try {
          const hospitalDoctors = await hospitalDoctorsApi.getDoctors(hospitalId);
          const associatedDoctorIds = new Set(hospitalDoctors.map((hd: HospitalDoctor) => hd.doctorId));
          availableDoctors = availableDoctors.filter((doctor: { id: string; firstName: string; lastName: string; specialty: string }) => !associatedDoctorIds.has(doctor.id));
        } catch (error) {
          console.warn('Failed to fetch hospital doctors for filtering:', error);
          // Continue with all doctors if we can't fetch hospital doctors
        }
      }

      return availableDoctors;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  },

  // Get doctor roles
  getDoctorRoles: async (): Promise<Array<{ value: string; label: string }>> => {
    return [
      { value: 'HEAD_OF_DEPARTMENT', label: 'Head of Department' },
      { value: 'CONSULTANT', label: 'Consultant' },
      { value: 'SENIOR_CONSULTANT', label: 'Senior Consultant' },
      { value: 'RESIDENT', label: 'Resident' },
      { value: 'INTERN', label: 'Intern' },
      { value: 'GENERAL_PRACTITIONER', label: 'General Practitioner' }
    ];
  }
};

// Hospital Doctors API
export const hospitalDoctorsApi = {
  // Get all doctors for a hospital
  getDoctors: async (hospitalId: string): Promise<HospitalDoctor[]> => {
    try {
      // Construct URL properly - always include /api/v1
      const url = `${API_CONFIG.HOSPITAL_SERVICE_URL}/api/v1/hospitals/${hospitalId}/doctors`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
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
  },

  // Add doctor to hospital
  addDoctor: async (hospitalId: string, data: AddDoctorRequest): Promise<HospitalDoctor> => {
    try {
      const requestBody: any = {};
      if (data.role) requestBody.role = data.role;
      if (data.shift) requestBody.shift = data.shift;
      if (data.startTime) requestBody.startTime = data.startTime;
      if (data.endTime) requestBody.endTime = data.endTime;
      if (data.consultationFee !== undefined && data.consultationFee > 0) {
        requestBody.consultationFee = Math.round(data.consultationFee * 100); // Convert to cents
      }
      if (data.status) requestBody.status = data.status;

      // Construct URL properly - always include /api/v1
      // HOSPITAL_SERVICE_URL is either:
      // - http://localhost:3002 (direct connection)
      // - /api/hospital-service (via nginx proxy)
      // Both need /api/v1 in the path since the service has global prefix
      const url = `${API_CONFIG.HOSPITAL_SERVICE_URL}/api/v1/hospitals/${hospitalId}/doctors/${data.doctorId}`;
      
      console.log('📤 [HOSPITAL_DOCTORS] Adding doctor:', { 
        url, 
        hospitalId, 
        doctorId: data.doctorId, 
        requestBody,
        HOSPITAL_SERVICE_URL: API_CONFIG.HOSPITAL_SERVICE_URL,
        ENDPOINTS_HOSPITALS: API_CONFIG.ENDPOINTS.HOSPITALS
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('📥 [HOSPITAL_DOCTORS] Response:', { 
        status: response.status, 
        statusText: response.statusText, 
        body: responseText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        let errorData: any = {};
        let errorMessage = `Failed to add doctor: ${response.status} ${response.statusText}`;
        
        if (responseText) {
          try {
            errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // Not JSON, use raw text
            errorData = { message: responseText };
            errorMessage = responseText || errorMessage;
          }
        } else {
          // Empty response body - provide status-based message
          if (response.status === 401) {
            errorMessage = 'Authentication required. Please log in again.';
          } else if (response.status === 403) {
            errorMessage = 'You do not have permission to perform this action.';
          } else if (response.status === 404) {
            errorMessage = 'Route not found. The service may need to be restarted.';
          } else if (response.status === 400) {
            errorMessage = 'Invalid request data. Please check the form fields.';
          }
          errorData = { message: errorMessage, status: response.status };
        }
        
        console.error('❌ [HOSPITAL_DOCTORS] Error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          responseText,
        });
        throw new Error(errorMessage);
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error('❌ [HOSPITAL_DOCTORS] Error adding doctor:', error);
      throw error;
    }
  },

  // Update doctor role in hospital
  updateDoctorRole: async (hospitalId: string, doctorId: string, data: UpdateDoctorRoleRequest): Promise<HospitalDoctor> => {
    try {
      // Always include /api/v1 in the path
      const url = `${API_CONFIG.HOSPITAL_SERVICE_URL}/api/v1/hospitals/${hospitalId}/doctors/${doctorId}/role`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update doctor role: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating doctor role:', error);
      throw error;
    }
  },

  // Remove doctor from hospital
  removeDoctor: async (hospitalId: string, doctorId: string): Promise<void> => {
    try {
      // Always include /api/v1 in the path
      const url = `${API_CONFIG.HOSPITAL_SERVICE_URL}/api/v1/hospitals/${hospitalId}/doctors/${doctorId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to remove doctor: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error removing doctor:', error);
      throw error;
    }
  },
};
