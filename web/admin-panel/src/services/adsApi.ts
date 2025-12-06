import { API_CONFIG } from '@/config/api';

export type AdStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'EXPIRED';
export type AdType = 'BANNER' | 'CAROUSEL' | 'INTERSTITIAL';

export interface Ad {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  type: AdType;
  status: AdStatus;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  priority: number;
  clickCount: number;
  viewCount: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdDto {
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  type?: AdType;
  status?: AdStatus;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  priority?: number;
  createdBy?: string;
}

export interface UpdateAdDto {
  title?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  type?: AdType;
  status?: AdStatus;
  startDate?: string;
  endDate?: string;
  priority?: number;
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
    return process.env.NEXT_PUBLIC_ADS_SERVICE_URL || 'http://72.62.51.50:3007';
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
      const response = await fetch(`${this.getBaseUrl()}/api/v1/ads`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(ad),
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
      const response = await fetch(`${this.getBaseUrl()}/api/v1/ads/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(ad),
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
}

export const adsApi = new AdsApiService();

