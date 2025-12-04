import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min, IsUrl } from 'class-validator';
import { AdType, AdStatus } from '@prisma/client';

export class CreateAdDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsUrl()
  imageUrl: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  linkUrl?: string;

  @IsOptional()
  @IsEnum(AdType)
  type?: AdType;

  @IsOptional()
  @IsEnum(AdStatus)
  status?: AdStatus;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsString()
  createdBy?: string;
}

