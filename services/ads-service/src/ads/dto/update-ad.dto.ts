import { PartialType } from '@nestjs/mapped-types';
import { CreateAdDto } from './create-ad.dto';
import { IsOptional, IsInt, Min, IsString, IsDateString } from 'class-validator';

export class UpdateAdDto extends PartialType(CreateAdDto) {
  @IsOptional()
  @IsString()
  image?: string; // File path after upload

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  clickCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  viewCount?: number;
}

