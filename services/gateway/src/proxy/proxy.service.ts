import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ProxyService {
  private readonly services = {
    user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    triage: process.env.TRIAGE_SERVICE_URL || 'http://localhost:3003',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
  };

  constructor(private readonly configService: ConfigService) {}

  async proxyRequest(service: string, path: string, method: string, data?: any, headers?: any) {
    const serviceUrl = this.services[service];
    if (!serviceUrl) {
      throw new Error(`Service ${service} not found`);
    }

    const url = `${serviceUrl}${path}`;
    
    try {
      const response = await axios({
        method: method.toLowerCase(),
        url,
        data,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        timeout: 30000, // Increased timeout to 30 seconds
        validateStatus: () => true, // Don't throw on any status code
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      // Handle axios errors
      if (error.response) {
        // Service responded with error status
        return {
          status: error.response.status,
          data: error.response.data || { message: 'Service error' },
          headers: error.response.headers,
        };
      } else if (error.request) {
        // Request was made but no response received
        throw new Error(`Service ${service} is not responding. Connection timeout or service unavailable.`);
      } else {
        // Error setting up the request
        throw new Error(`Failed to proxy request to ${service}: ${error.message}`);
      }
    }
  }

  async proxyToUserService(path: string, method: string, data?: any, headers?: any) {
    return this.proxyRequest('user', path, method, data, headers);
  }

  async proxyToTriageService(path: string, method: string, data?: any, headers?: any) {
    return this.proxyRequest('triage', path, method, data, headers);
  }

  async proxyToNotificationService(path: string, method: string, data?: any, headers?: any) {
    return this.proxyRequest('notification', path, method, data, headers);
  }
}
