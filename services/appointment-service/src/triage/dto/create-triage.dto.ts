import { IsString, IsOptional, IsEnum } from 'class-validator';
import { UrgencyLevel } from '@prisma/client';

export class CreateTriageDto {
  @IsString()
  patientId: string;

  @IsString()
  symptoms: string;

  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel;

  @IsOptional()
  @IsString()
  predictedSpecialty?: string;
}
