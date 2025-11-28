import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DoctorServiceClient {
  private readonly logger = new Logger(DoctorServiceClient.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('DOCTOR_SERVICE_URL') || 'http://localhost:3003';
  }

  async getDoctorById(doctorId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/doctors/${doctorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage: string;
        
        // Handle different error status codes with custom messages
        if (response.status === 404) {
          errorMessage = `Doctor with ID ${doctorId} not found`;
        } else if (response.status === 429) {
          errorMessage = `Too many requests to doctor service. Please try again in a moment.`;
        } else if (response.status >= 500) {
          errorMessage = `Doctor service is temporarily unavailable. Please try again later.`;
        } else {
          errorMessage = `Failed to fetch doctor: ${response.status} ${response.statusText}`;
        }
        
        const error: any = new Error(errorMessage);
        error.status = response.status;
        error.statusCode = response.status;
        error.response = errorText;
        throw error;
      }

      return await response.json();
    } catch (error: any) {
      this.logger.error(`Error fetching doctor ${doctorId}: ${error instanceof Error ? error.message : String(error)}`);
      // Re-throw with original error to preserve status code
      throw error;
    }
  }

  async getDoctorAvailability(doctorId: string, date: string): Promise<any> {
    // This will check doctor's schedule and existing appointments
    // For now, return basic info - can be enhanced later
    try {
      const doctor = await this.getDoctorById(doctorId);
      return {
        isAvailable: doctor.isAvailable,
        selfEmployedConsultationFee: doctor.selfEmployedConsultationFee,
      };
    } catch (error) {
      this.logger.error(`Error checking doctor availability: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

