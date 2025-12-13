import { PartialType } from '@nestjs/mapped-types';
import { CreateAdDto } from './create-ad.dto';
import { IsOptional, IsInt, Min, IsString, IsDateString, IsEnum } from 'class-validator';
import { AdStatus, AdType } from '@prisma/client';

export class UpdateAdDto extends PartialType(CreateAdDto) {
  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string; // File path after upload

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  range?: number;

  @IsOptional()
  @IsEnum(AdStatus)
  status?: AdStatus;

  @IsOptional()
  @IsEnum(AdType)
  type?: AdType;

  @IsOptional()
  @IsInt()
  @Min(0)
  clickCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  viewCount?: number;
}

