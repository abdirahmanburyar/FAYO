import { IsString, IsOptional, IsDateString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { AppointmentStatus, UrgencyLevel } from '@prisma/client';

export class CreateAppointmentDto {
  @IsString()
  patientId: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(120)
  duration?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  triageId?: string;

  @IsOptional()
  @IsString()
  symptoms?: string;

  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel;

  @IsOptional()
  @IsString()
  predictedSpecialty?: string;
}
