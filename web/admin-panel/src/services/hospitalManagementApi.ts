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
  isActive: boolean;
  joinedAt: string;
  leftAt?: string;
  createdAt: string;
  updatedAt: string;
  doctor: {
    id: string;
    userId: string;
    specialty: string;
    licenseNumber: string;
    experience: number;
    isVerified: boolean;
    isAvailable: boolean;
    consultationFee?: number;
    bio?: string;
    createdAt: string;
    updatedAt: string;
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
  role: string;
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

  // Get available services (from shared service)
  getAvailableServices: async (): Promise<Array<{ id: string; name: string; description?: string }>> => {
    try {
      const response = await fetch(`${API_CONFIG.SHARED_SERVICE_URL}/api/v1/services`, {
        method: 'GET',
        headers: getAuthHeaders(),
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
  },

  // Get available doctors (from doctor service)
  getAvailableDoctors: async (): Promise<Array<{ id: string; firstName: string; lastName: string; specialty: string }>> => {
    try {
      const response = await fetch(`${API_CONFIG.DOCTOR_SERVICE_URL}${API_CONFIG.ENDPOINTS.DOCTORS}`, {
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
      const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}/${hospitalId}/doctors`, {
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
      const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}/${hospitalId}/doctors/${data.doctorId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: data.role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to add doctor: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding doctor:', error);
      throw error;
    }
  },

  // Update doctor role in hospital
  updateDoctorRole: async (hospitalId: string, doctorId: string, data: UpdateDoctorRoleRequest): Promise<HospitalDoctor> => {
    try {
      const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}/${hospitalId}/doctors/${doctorId}/role`, {
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
      const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}/${hospitalId}/doctors/${doctorId}`, {
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
