import { API_CONFIG } from '@/config/api';

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';
export type ConsultationType = 'IN_PERSON' | 'VIDEO' | 'PHONE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';

export interface Appointment {
  id: string;
  appointmentNumber: number;
  patientId: string;
  doctorId: string;
  hospitalId?: string;
  specialtyId?: string;
  appointmentDate: string; // ISO date string
  appointmentTime: string; // HH:MM format
  duration: number; // minutes
  status: AppointmentStatus;
  consultationType: ConsultationType;
  reason?: string;
  description?: string;
  consultationFee: number; // in cents
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentTransactionId?: string;
  createdBy: 'ADMIN' | 'PATIENT';
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  hospitalId?: string;
  specialtyId?: string;
  appointmentDate: string; // ISO date string
  appointmentTime: string; // HH:MM format
  duration?: number; // minutes, default 30
  consultationType?: ConsultationType; // default IN_PERSON
  reason?: string;
  description?: string;
  createdBy: 'ADMIN' | 'PATIENT';
}

export interface UpdateAppointmentDto {
  appointmentDate?: string;
  appointmentTime?: string;
  newAppointmentDate?: string; // For rescheduling
  newAppointmentTime?: string; // For rescheduling
  duration?: number;
  consultationType?: ConsultationType;
  reason?: string;
  description?: string;
  status?: AppointmentStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  paymentTransactionId?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  notes?: string;
}

export interface AppointmentStats {
  total: number;
  byStatus: Array<{ status: AppointmentStatus; count: number }>;
  byPaymentStatus: Array<{ paymentStatus: PaymentStatus; count: number }>;
  revenue: number; // in cents
  revenueUSD: number; // in dollars
}

class AppointmentsApiService {
  private getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getAppointments(filters?: {
    patientId?: string;
    doctorId?: string;
    hospitalId?: string;
    status?: AppointmentStatus;
    paymentStatus?: PaymentStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<Appointment[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.patientId) queryParams.append('patientId', filters.patientId);
      if (filters?.doctorId) queryParams.append('doctorId', filters.doctorId);
      if (filters?.hospitalId) queryParams.append('hospitalId', filters.hospitalId);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.paymentStatus) queryParams.append('paymentStatus', filters.paymentStatus);
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);

      const url = `${API_CONFIG.APPOINTMENT_SERVICE_URL}${API_CONFIG.ENDPOINTS.APPOINTMENTS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('[AppointmentsApi] Fetching appointments from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch appointments: ${response.statusText}`);
      }

      const appointments = await response.json();
      console.log('[AppointmentsApi] Received appointments:', appointments.length);
      return Array.isArray(appointments) ? appointments : [];
    } catch (error) {
      console.error('[AppointmentsApi] Error fetching appointments:', error);
      throw error;
    }
  }

  async getAppointmentById(id: string): Promise<Appointment> {
    try {
      const response = await fetch(`${API_CONFIG.APPOINTMENT_SERVICE_URL}${API_CONFIG.ENDPOINTS.APPOINTMENTS}/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch appointment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[AppointmentsApi] Error fetching appointment:', error);
      throw error;
    }
  }

  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    try {
      const response = await fetch(`${API_CONFIG.APPOINTMENT_SERVICE_URL}${API_CONFIG.ENDPOINTS.APPOINTMENTS}/patient/${patientId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch patient appointments: ${response.statusText}`);
      }

      const appointments = await response.json();
      return Array.isArray(appointments) ? appointments : [];
    } catch (error) {
      console.error('[AppointmentsApi] Error fetching patient appointments:', error);
      throw error;
    }
  }

  async getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
    try {
      const response = await fetch(`${API_CONFIG.APPOINTMENT_SERVICE_URL}${API_CONFIG.ENDPOINTS.APPOINTMENTS}/doctor/${doctorId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch doctor appointments: ${response.statusText}`);
      }

      const appointments = await response.json();
      return Array.isArray(appointments) ? appointments : [];
    } catch (error) {
      console.error('[AppointmentsApi] Error fetching doctor appointments:', error);
      throw error;
    }
  }

  async getAppointmentsByHospital(hospitalId: string): Promise<Appointment[]> {
    try {
      const response = await fetch(`${API_CONFIG.APPOINTMENT_SERVICE_URL}${API_CONFIG.ENDPOINTS.APPOINTMENTS}/hospital/${hospitalId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch hospital appointments: ${response.statusText}`);
      }

      const appointments = await response.json();
      return Array.isArray(appointments) ? appointments : [];
    } catch (error) {
      console.error('[AppointmentsApi] Error fetching hospital appointments:', error);
      throw error;
    }
  }

  async createAppointment(appointmentData: CreateAppointmentDto): Promise<Appointment> {
    try {
      console.log('[AppointmentsApi] Creating appointment:', appointmentData);
      
      const response = await fetch(`${API_CONFIG.APPOINTMENT_SERVICE_URL}${API_CONFIG.ENDPOINTS.APPOINTMENTS}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(appointmentData),
      });

      console.log('[AppointmentsApi] Create response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `Failed to create appointment: ${response.status} ${response.statusText}` };
        }
        throw new Error(errorData.message || errorData.error || `Failed to create appointment: ${response.status} ${response.statusText}`);
      }

      const createdAppointment = await response.json();
      console.log('[AppointmentsApi] Successfully created appointment:', createdAppointment.id);
      return createdAppointment;
    } catch (error) {
      console.error('[AppointmentsApi] Error creating appointment:', error);
      throw error;
    }
  }

  async updateAppointment(id: string, appointmentData: UpdateAppointmentDto): Promise<Appointment> {
    try {
      console.log('[AppointmentsApi] Updating appointment:', id, appointmentData);
      
      const response = await fetch(`${API_CONFIG.APPOINTMENT_SERVICE_URL}${API_CONFIG.ENDPOINTS.APPOINTMENTS}/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(appointmentData),
      });

      console.log('[AppointmentsApi] Update response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `Failed to update appointment: ${response.status} ${response.statusText}` };
        }
        throw new Error(errorData.message || errorData.error || `Failed to update appointment: ${response.status} ${response.statusText}`);
      }

      const updatedAppointment = await response.json();
      console.log('[AppointmentsApi] Successfully updated appointment:', updatedAppointment.id);
      return updatedAppointment;
    } catch (error) {
      console.error('[AppointmentsApi] Error updating appointment:', error);
      throw error;
    }
  }

  async confirmAppointment(id: string): Promise<Appointment> {
    try {
      const response = await fetch(`${API_CONFIG.APPOINTMENT_SERVICE_URL}${API_CONFIG.ENDPOINTS.APPOINTMENTS}/${id}/confirm`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to confirm appointment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[AppointmentsApi] Error confirming appointment:', error);
      throw error;
    }
  }

  async completeAppointment(id: string, notes?: string): Promise<Appointment> {
    try {
      const response = await fetch(`${API_CONFIG.APPOINTMENT_SERVICE_URL}${API_CONFIG.ENDPOINTS.APPOINTMENTS}/${id}/complete`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to complete appointment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[AppointmentsApi] Error completing appointment:', error);
      throw error;
    }
  }

  async cancelAppointment(id: string, cancelledBy: string, reason?: string): Promise<Appointment> {
    try {
      const response = await fetch(`${API_CONFIG.APPOINTMENT_SERVICE_URL}${API_CONFIG.ENDPOINTS.APPOINTMENTS}/${id}/cancel`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ cancelledBy, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to cancel appointment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[AppointmentsApi] Error cancelling appointment:', error);
      throw error;
    }
  }

  async rescheduleAppointment(id: string, newDate: string, newTime: string): Promise<Appointment> {
    try {
      const response = await fetch(`${API_CONFIG.APPOINTMENT_SERVICE_URL}${API_CONFIG.ENDPOINTS.APPOINTMENTS}/${id}/reschedule`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ newDate, newTime }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to reschedule appointment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[AppointmentsApi] Error rescheduling appointment:', error);
      throw error;
    }
  }

  async deleteAppointment(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.APPOINTMENT_SERVICE_URL}${API_CONFIG.ENDPOINTS.APPOINTMENTS}/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete appointment: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[AppointmentsApi] Error deleting appointment:', error);
      throw error;
    }
  }

  async getStats(): Promise<AppointmentStats> {
    try {
      const response = await fetch(`${API_CONFIG.APPOINTMENT_SERVICE_URL}${API_CONFIG.ENDPOINTS.APPOINTMENTS}/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch appointment stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[AppointmentsApi] Error fetching appointment stats:', error);
      throw error;
    }
  }
}

export const appointmentsApi = new AppointmentsApiService();

