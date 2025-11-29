interface Payment {
  id: string;
  appointmentId: string;
  amount: number;
  currency: string;
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHEQUE' | 'OTHER';
  paymentStatus: 'PAID' | 'REFUNDED' | 'CANCELLED';
  transactionId?: string;
  receiptNumber?: string;
  paidBy?: string;
  processedBy?: string;
  notes?: string;
  paymentDate?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreatePaymentRequest {
  appointmentId: string;
  amount: number;
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHEQUE' | 'OTHER';
  currency?: string;
  transactionId?: string;
  notes?: string;
  paidBy?: string;
  processedBy?: string;
}

interface ProcessPaymentRequest {
  processedBy: string;
}

interface RefundPaymentRequest {
  refundReason: string;
  refundedBy: string;
}

class PaymentApiService {
  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private isConnectionError(error: any): boolean {
    return (
      error instanceof TypeError &&
      (error.message.includes('Failed to fetch') ||
       error.message.includes('NetworkError') ||
       error.message.includes('ERR_CONNECTION_REFUSED') ||
       error.message.includes('ERR_NETWORK'))
    );
  }

  private createConnectionError(originalError: any): Error {
    return new Error(
      `Cannot connect to payment-service. Please ensure it's running on port 3006. Original error: ${originalError.message || 'Failed to fetch'}`
    );
  }

  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    try {
      const url = '/api/v1/payments';
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create payment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (this.isConnectionError(error)) {
        throw this.createConnectionError(error);
      }
      throw error;
    }
  }

  async processPayment(paymentId: string, processedBy: string): Promise<Payment> {
    try {
      const url = `/api/v1/payments/${paymentId}/process`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ processedBy }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to process payment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (this.isConnectionError(error)) {
        throw this.createConnectionError(error);
      }
      throw error;
    }
  }

  async getPaymentsByAppointment(appointmentId: string): Promise<Payment[]> {
    try {
      const url = `/api/v1/payments/appointment/${appointmentId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch payments: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (this.isConnectionError(error)) {
        throw this.createConnectionError(error);
      }
      throw error;
    }
  }

  async getAllPayments(filters?: {
    appointmentId?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Payment[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.appointmentId) queryParams.append('appointmentId', filters.appointmentId);
      if (filters?.paymentStatus) queryParams.append('paymentStatus', filters.paymentStatus);
      if (filters?.paymentMethod) queryParams.append('paymentMethod', filters.paymentMethod);
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);

      const url = `/api/v1/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch payments: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (this.isConnectionError(error)) {
        throw this.createConnectionError(error);
      }
      throw error;
    }
  }

  async getPayment(paymentId: string): Promise<Payment> {
    try {
      const url = `/api/v1/payments/${paymentId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch payment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (this.isConnectionError(error)) {
        throw this.createConnectionError(error);
      }
      throw error;
    }
  }

  async refundPayment(paymentId: string, refundReason: string, refundedBy: string): Promise<Payment> {
    try {
      const url = `/api/v1/payments/${paymentId}/refund`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ refundReason, refundedBy }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to refund payment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (this.isConnectionError(error)) {
        throw this.createConnectionError(error);
      }
      throw error;
    }
  }
}

export const paymentApi = new PaymentApiService();
export type { Payment, CreatePaymentRequest, ProcessPaymentRequest, RefundPaymentRequest };

