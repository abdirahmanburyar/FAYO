import { API_CONFIG } from '@/config/api';

export interface CallSession {
  id: string;
  appointmentId: string;
  channelName: string;
  hostUid: number | string;
  participantUid: number | string;
  status: string;
  createdAt: string;
}

export interface CallCredential {
  appId: string;
  token: string;
  channelName: string;
  uid: number | string;
  role: 'HOST' | 'AUDIENCE';
  expiresAt: string;
  expiresIn: number;
}

export interface CreateCallResponse {
  session: CallSession;
  credential: CallCredential;
}

class CallApiService {
  private getAppointmentServiceUrl(): string {
    // Force HTTP for development - HTTPS disabled
    if (typeof window !== 'undefined') {
      // Development/HTTP: use direct URL or env variable
      return process.env.NEXT_PUBLIC_APPOINTMENT_SERVICE_URL || 'http://localhost:3005';
    }
    return process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3005';
  }

  private getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private buildUrl(endpoint: string): string {
    const appointmentServiceUrl = this.getAppointmentServiceUrl();
    // If using nginx proxy (contains /api/appointment-service), nginx strips the prefix
    // Otherwise, use /api/v1 prefix for direct service access
    const isProxyUrl = appointmentServiceUrl.includes('/api/appointment-service');
    const basePath = isProxyUrl ? '' : '/api/v1';
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${appointmentServiceUrl}${basePath}${normalizedEndpoint}`;
  }

  /**
   * Create a video call session for an appointment
   * @param appointmentId - Appointment ID
   * @param userId - Admin/Doctor user ID initiating the call
   * @returns Call session and credentials
   */
  async createCall(
    appointmentId: string,
    userId: string,
  ): Promise<CreateCallResponse> {
    try {
      const response = await fetch(this.buildUrl('/calls'), {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          appointmentId,
          userId,
          role: 1, // HOST
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `Failed to create call: ${response.status} ${response.statusText}` };
        }
        throw new Error(errorData.message || errorData.error || `Failed to create call: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[CallApi] Error creating call:', error);
      throw error;
    }
  }

  /**
   * Get participant credentials for joining a call
   * @param appointmentId - Appointment ID
   * @param userId - Patient user ID
   * @returns Participant credentials
   */
  async getParticipantCredentials(
    appointmentId: string,
    userId: string,
  ): Promise<{ credential: CallCredential }> {
    try {
      const response = await fetch(
        this.buildUrl(`/calls/participant/${appointmentId}?userId=${encodeURIComponent(userId)}`),
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `Failed to get participant credentials: ${response.status} ${response.statusText}` };
        }
        throw new Error(errorData.message || errorData.error || `Failed to get participant credentials: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[CallApi] Error getting participant credentials:', error);
      throw error;
    }
  }

  /**
   * End a call session
   * @param appointmentId - Appointment ID
   * @param userId - User ID ending the call
   */
  async endCall(appointmentId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(this.buildUrl(`/calls/${appointmentId}/end`), {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `Failed to end call: ${response.status} ${response.statusText}` };
        }
        throw new Error(errorData.message || errorData.error || `Failed to end call: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[CallApi] Error ending call:', error);
      throw error;
    }
  }
}

export const callApi = new CallApiService();

// Legacy function names for backward compatibility
export async function createCallSession(
  appointmentId: string,
  userId: string,
): Promise<CreateCallResponse> {
  return callApi.createCall(appointmentId, userId);
}

export async function requestCallToken(
  appointmentId: string,
  userId: string,
  role: 'HOST' | 'AUDIENCE' = 'HOST',
): Promise<{ credential: CallCredential }> {
  if (role === 'HOST') {
    const response = await callApi.createCall(appointmentId, userId);
    return { credential: response.credential };
  } else {
    return callApi.getParticipantCredentials(appointmentId, userId);
  }
}
