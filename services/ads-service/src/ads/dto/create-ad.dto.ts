import { IsString, IsOptional, IsDateString, IsInt, Min, IsEnum } from 'class-validator';

// Local enums to avoid client import issues; keep in sync with Prisma schema
export enum AdStatusEnum {
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  PUBLISHED = 'PUBLISHED',
}

export enum AdTypeEnum {
  BANNER = 'BANNER',
  CAROUSEL = 'CAROUSEL',
  INTERSTITIAL = 'INTERSTITIAL',
}

export class CreateAdDto {
  @IsString()
  company: string; // Company or person name

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  imageUrl: string; // Image URL (uploaded separately via /uploads endpoint)

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsOptional()
  @IsEnum(AdTypeEnum)
  type?: AdTypeEnum;

  @IsDateString()
  startDate: string;

  @IsInt()
  @Min(1)
  range: number; // Number of days (endDate = startDate + range)

  @IsOptional()
  @IsEnum(AdStatusEnum)
  status?: AdStatusEnum;

  @IsOptional()
  @IsString()
  createdBy?: string;
}

