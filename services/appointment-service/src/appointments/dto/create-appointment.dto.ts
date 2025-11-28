import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsInt, Min, IsBoolean } from 'class-validator';

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
  @IsNotEmpty()
  doctorId: string;

  @IsString()
  @IsOptional()
  hospitalId?: string;

  @IsString()
  @IsOptional()
  specialtyId?: string;

  @IsDateString()
  @IsNotEmpty()
  appointmentDate: string; // ISO date string

  @IsString()
  @IsNotEmpty()
  appointmentTime: string; // HH:MM format

  @IsInt()
  @Min(15)
  @IsOptional()
  duration?: number; // minutes, default 30

  @IsEnum(ConsultationType)
  @IsOptional()
  consultationType?: ConsultationType; // default IN_PERSON

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  createdBy: 'ADMIN' | 'PATIENT'; // Who is creating the appointment
}

