import { IsString, IsOptional, IsDateString, IsInt, Min, IsEnum } from 'class-validator';
import { AdStatus } from '@prisma/client';

export class CreateAdDto {
  @IsString()
  company: string; // Company or person name

  @IsString()
  image: string; // File path after upload

  @IsDateString()
  startDate: string;

  @IsInt()
  @Min(1)
  range: number; // Number of days (endDate = startDate + range)

  @IsOptional()
  @IsEnum(AdStatus)
  status?: AdStatus;

  @IsOptional()
  @IsString()
  createdBy?: string;
}

