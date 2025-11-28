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
  private getPaymentServiceUrl(): string {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 'http://localhost:3006';
    }
    return 'http://localhost:3006';
  }

  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hospitalToken') : null;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async buildUrl(endpoint: string): string {
    const baseUrl = this.getPaymentServiceUrl();
    return `${baseUrl}/api/v1${endpoint}`;
  }

  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    const url = await this.buildUrl('/payments');
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
  }

  async processPayment(paymentId: string, processedBy: string): Promise<Payment> {
    const url = await this.buildUrl(`/payments/${paymentId}/process`);
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
  }

  async getPaymentsByAppointment(appointmentId: string): Promise<Payment[]> {
    const url = await this.buildUrl(`/payments/appointment/${appointmentId}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch payments: ${response.statusText}`);
    }

    return await response.json();
  }

  async getAllPayments(filters?: {
    appointmentId?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Payment[]> {
    const queryParams = new URLSearchParams();
    if (filters?.appointmentId) queryParams.append('appointmentId', filters.appointmentId);
    if (filters?.paymentStatus) queryParams.append('paymentStatus', filters.paymentStatus);
    if (filters?.paymentMethod) queryParams.append('paymentMethod', filters.paymentMethod);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);

    const url = await this.buildUrl(`/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch payments: ${response.statusText}`);
    }

    return await response.json();
  }

  async getPayment(paymentId: string): Promise<Payment> {
    const url = await this.buildUrl(`/payments/${paymentId}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch payment: ${response.statusText}`);
    }

    return await response.json();
  }

  async refundPayment(paymentId: string, refundReason: string, refundedBy: string): Promise<Payment> {
    const url = await this.buildUrl(`/payments/${paymentId}/refund`);
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
  }
}

export const paymentApi = new PaymentApiService();
export type { Payment, CreatePaymentRequest, ProcessPaymentRequest, RefundPaymentRequest };

