import { IsString, IsEnum } from 'class-validator';
import { UrgencyLevel } from '@prisma/client';

export class UpdateTriageResultDto {
  @IsString()
  predictedSpecialty: string;

  @IsEnum(UrgencyLevel)
  urgency: UrgencyLevel;
}
