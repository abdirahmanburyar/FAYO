import { API_CONFIG } from '@/config/api';

export interface User {
  id: string;
  username?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  userType: 'PATIENT' | 'DOCTOR' | 'HOSPITAL_MANAGER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
}

export interface Doctor {
  id: string;
  userId: string;
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
  user: User;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  doctors?: Doctor[];
}

export interface CreateUserDto {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  userType: 'PATIENT' | 'DOCTOR' | 'HOSPITAL_MANAGER';
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  role?: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  userType?: 'PATIENT' | 'DOCTOR' | 'HOSPITAL_MANAGER';
  isActive?: boolean;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
}

class UsersApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // Get all users
  async getUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_CONFIG.USER_SERVICE_URL}/api/v1/users`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const users = await response.json();
      console.log('Fetched users:', users?.length || 0);
      
      // Ensure we always return an array
      return Array.isArray(users) ? users : [];
    } catch (error) {
      console.error('Error fetching users:', error);
      // Return empty array instead of throwing to prevent crashes
      console.warn('Returning empty users array due to error');
      return [];
    }
  }

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    try {
      const response = await fetch(`${API_CONFIG.USER_SERVICE_URL}/api/v1/users/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Create new user
  async createUser(userData: CreateUserDto): Promise<User> {
    try {
      console.log('Sending user data:', userData);
      
      const response = await fetch(`${API_CONFIG.USER_SERVICE_URL}/api/v1/users`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('User creation failed:', response.status, errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `Failed to create user: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(id: string, userData: UpdateUserDto): Promise<User> {
    try {
      const response = await fetch(`${API_CONFIG.USER_SERVICE_URL}/api/v1/users/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update user: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user (soft delete)
  async deleteUser(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.USER_SERVICE_URL}/api/v1/users/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete user: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get all doctors
  async getDoctors(): Promise<Doctor[]> {
    try {
      const response = await fetch(`${API_CONFIG.USER_SERVICE_URL}/api/v1/doctors`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch doctors: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  }

  // Get doctor by ID
  async getDoctorById(id: string): Promise<Doctor> {
    try {
      const response = await fetch(`${API_CONFIG.USER_SERVICE_URL}/api/v1/doctors/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch doctor: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching doctor:', error);
      throw error;
    }
  }

  // Create new doctor
  async createDoctor(doctorData: any): Promise<Doctor> {
    try {
      const response = await fetch(`${API_CONFIG.USER_SERVICE_URL}/api/v1/doctors`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(doctorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create doctor: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating doctor:', error);
      throw error;
    }
  }

  // Update doctor
  async updateDoctor(id: string, doctorData: any): Promise<Doctor> {
    try {
      const response = await fetch(`${API_CONFIG.USER_SERVICE_URL}/api/v1/doctors/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(doctorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update doctor: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating doctor:', error);
      throw error;
    }
  }

  // Delete doctor
  async deleteDoctor(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.USER_SERVICE_URL}/api/v1/doctors/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete doctor: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting doctor:', error);
      throw error;
    }
  }

  // Get all hospitals
  async getHospitals(): Promise<Hospital[]> {
    try {
      const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}/api/v1/hospitals`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch hospitals: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      throw error;
    }
  }

  // Get hospital by ID
  async getHospitalById(id: string): Promise<Hospital> {
    try {
      const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}/api/v1/hospitals/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch hospital: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching hospital:', error);
      throw error;
    }
  }

  // Create new hospital
  async createHospital(hospitalData: Omit<Hospital, 'id' | 'createdAt' | 'updatedAt' | 'doctors'>): Promise<Hospital> {
    try {
      const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}/api/v1/hospitals`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(hospitalData),
      });

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
  async updateHospital(id: string, hospitalData: Partial<Omit<Hospital, 'id' | 'createdAt' | 'updatedAt' | 'doctors'>>): Promise<Hospital> {
    try {
      const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}/api/v1/hospitals/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(hospitalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update hospital: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating hospital:', error);
      throw error;
    }
  }

  // Delete hospital
  async deleteHospital(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}/api/v1/hospitals/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete hospital: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting hospital:', error);
      throw error;
    }
  }
}

export const usersApi = new UsersApiService();
