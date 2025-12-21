import { API_CONFIG } from '@/config/api';

export type AdStatus = 'INACTIVE' | 'PUBLISHED';

export interface Ad {
  id: string;
  company: string; // Company or person name
  imageUrl: string; // File path to uploaded image (changed from 'image' to match backend)
  startDate: string; // ISO date string
  endDate: string; // ISO date string (calculated from startDate + range)
  range: number; // Number of days (endDate = startDate + range)
  price?: number; // Price per day in dollars
  status: AdStatus;
  clickCount: number;
  viewCount: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdDto {
  company: string; // Company or person name
  imageUrl: string; // Image URL (uploaded separately)
  startDate: string; // ISO date string
  range: number; // Number of days (endDate = startDate + range)
  price: number; // Price per day in dollars
  status?: AdStatus;
  createdBy?: string;
}

export interface UpdateAdDto {
  company?: string;
  imageUrl?: string; // Optional image URL (uploaded separately)
  startDate?: string;
  range?: number;
  status?: AdStatus;
}

export interface AdsListResponse {
  data: Ad[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class AdsApiService {
  private getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private getBaseUrl(): string {
    // Use unified API service URL
    if (typeof window !== 'undefined') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
        return apiUrl.replace('/api/v1', '');
      }
      // Fallback: construct from current location
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return `http://${window.location.hostname}:3001`;
      }
      return 'http://localhost:3001';
    }
    return 'http://api-service:3001';
  }

  async getAds(activeOnly?: boolean, page?: number, limit?: number): Promise<AdsListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (activeOnly) queryParams.append('activeOnly', 'true');
      if (page) queryParams.append('page', page.toString());
      if (limit) queryParams.append('limit', limit.toString());

      const response = await fetch(
        `${this.getBaseUrl()}/api/v1/ads?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ads:', error);
      throw error;
    }
  }

  async getActiveAds(page?: number, limit?: number): Promise<AdsListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (page) queryParams.append('page', page.toString());
      if (limit) queryParams.append('limit', limit.toString());

      const response = await fetch(
        `${this.getBaseUrl()}/api/v1/ads/active?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching active ads:', error);
      throw error;
    }
  }

  async getAd(id: string): Promise<Ad> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/v1/ads/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ad:', error);
      throw error;
    }
  }

  async createAd(ad: CreateAdDto): Promise<Ad> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.getBaseUrl()}/api/v1/ads`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          company: ad.company,
          imageUrl: ad.imageUrl,
          startDate: ad.startDate,
          range: ad.range,
          price: ad.price, // Required field
          status: ad.status,
          createdBy: ad.createdBy,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating ad:', error);
      throw error;
    }
  }

  async updateAd(id: string, ad: UpdateAdDto): Promise<Ad> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const body: any = {};
      if (ad.imageUrl) {
        body.imageUrl = ad.imageUrl;
      }
      if (ad.company) {
        body.company = ad.company;
      }
      if (ad.startDate) {
        body.startDate = ad.startDate;
      }
      if (ad.range !== undefined) {
        body.range = ad.range;
      }
      if (ad.status) {
        body.status = ad.status;
      }

      const response = await fetch(`${this.getBaseUrl()}/api/v1/ads/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating ad:', error);
      throw error;
    }
  }

  async deleteAd(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/v1/ads/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      throw error;
    }
  }

  async incrementViewCount(id: string): Promise<void> {
    try {
      await fetch(`${this.getBaseUrl()}/api/v1/ads/${id}/view`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }

  async incrementClickCount(id: string): Promise<void> {
    try {
      await fetch(`${this.getBaseUrl()}/api/v1/ads/${id}/click`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error incrementing click count:', error);
    }
  }

  /**
   * Calculate fee for an ad
   */
  async calculateFee(range: number, price: number): Promise<{ fee: number; feeInDollars: string; range: number; price: number }> {
    try {
      // Validate inputs
      const validRange = typeof range === 'number' && range > 0 ? range : 7;
      const validPrice = typeof price === 'number' && price > 0 ? price : 0;
      
      if (validPrice === 0) {
        throw new Error('Price must be greater than 0');
      }
      
      const queryParams = new URLSearchParams();
      queryParams.append('range', validRange.toString());
      queryParams.append('price', validPrice.toString());

      const response = await fetch(
        `${this.getBaseUrl()}/api/v1/ads/calculate-fee?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Ensure response has required fields
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response from fee calculation API');
      }
      
      // Calculate feeInDollars if not provided
      if (!data.feeInDollars && data.fee) {
        data.feeInDollars = (data.fee / 100).toFixed(2);
      }
      
      return {
        fee: data.fee || 0,
        feeInDollars: data.feeInDollars || '0.00',
        range: data.range || validRange,
        price: data.price || validPrice,
      };
    } catch (error) {
      console.error('Error calculating fee:', error);
      throw error;
    }
  }

  /**
   * Pay for an ad
   */
  async payForAd(
    adId: string,
    paymentData: {
      paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHEQUE' | 'OTHER';
      paidBy?: string;
      processedBy?: string;
      notes?: string;
      transactionId?: string;
    }
  ): Promise<{ payment: any; ad: Ad }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/v1/ads/${adId}/pay`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error paying for ad:', error);
      throw error;
    }
  }

  /**
   * Get payments for an ad
   */
  async getAdPayments(adId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/v1/ads/${adId}/payments`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ad payments:', error);
      throw error;
    }
  }
}

export const adsApi = new AdsApiService();

