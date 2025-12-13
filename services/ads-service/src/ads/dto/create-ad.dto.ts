import { IsString, IsOptional, IsDateString, IsInt, Min, IsEnum } from 'class-validator';
import { AdStatus, AdType } from '@prisma/client';

export class CreateAdDto {
  @IsString()
  company: string; // Company or person name

  @IsString()
  title: string;

  @IsString()
  imageUrl: string; // File path after upload

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsOptional()
  @IsEnum(AdType)
  type?: AdType;

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

