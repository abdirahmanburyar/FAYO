import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsInt, Min } from 'class-validator';

export enum ConsultationType {
  IN_PERSON = 'IN_PERSON',
  VIDEO = 'VIDEO',
  PHONE = 'PHONE',
}

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsOptional()
  doctorId?: string;

  @IsString()
  @IsOptional()
  hospitalId?: string;

  @IsString()
  @IsOptional()
  specialtyId?: string;

  @IsDateString()
  @IsNotEmpty()
  appointmentDate: string;

  @IsString()
  @IsNotEmpty()
  appointmentTime: string;

  @IsInt()
  @Min(15)
  @IsOptional()
  duration?: number;

  @IsEnum(ConsultationType)
  @IsOptional()
  consultationType?: ConsultationType;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  createdBy: 'ADMIN' | 'PATIENT';
}

