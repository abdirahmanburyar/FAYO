import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HospitalServiceClient {
  private readonly logger = new Logger(HospitalServiceClient.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('HOSPITAL_SERVICE_URL') || 'http://localhost:3002';
  }

  async getHospitalDoctorAssociation(hospitalId: string, doctorId: string): Promise<any> {
    try {
      // Get doctor's association with hospital
      const response = await fetch(`${this.baseUrl}/api/v1/hospitals/${hospitalId}/doctors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch hospital doctors: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const doctors = await response.json();
      const doctorAssociation = doctors.find((d: any) => d.doctorId === doctorId);
      
      if (!doctorAssociation) {
        throw new Error(`Doctor ${doctorId} is not associated with hospital ${hospitalId}`);
      }

      return doctorAssociation;
    } catch (error) {
      this.logger.error(`Error fetching hospital-doctor association: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getDoctorHospitals(doctorId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/hospitals/doctors/${doctorId}/hospitals`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch doctor hospitals: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Error fetching doctor hospitals: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
}

