import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ProxyService {
  private readonly services = {
    user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    appointment: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3002',
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
        timeout: 10000,
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      if (error.response) {
        return {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        };
      }
      throw error;
    }
  }

  async proxyToUserService(path: string, method: string, data?: any, headers?: any) {
    return this.proxyRequest('user', path, method, data, headers);
  }

  async proxyToAppointmentService(path: string, method: string, data?: any, headers?: any) {
    return this.proxyRequest('appointment', path, method, data, headers);
  }

  async proxyToTriageService(path: string, method: string, data?: any, headers?: any) {
    return this.proxyRequest('triage', path, method, data, headers);
  }

  async proxyToNotificationService(path: string, method: string, data?: any, headers?: any) {
    return this.proxyRequest('notification', path, method, data, headers);
  }
}
