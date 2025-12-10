import { IsString, IsOptional, IsDateString, IsInt, Min } from 'class-validator';

export class CreateAdDto {
  @IsString()
  image: string; // File path after upload

  @IsDateString()
  startDate: string;

  @IsInt()
  @Min(1)
  days: number; // Number of days the ad should be active

  @IsOptional()
  @IsString()
  createdBy?: string;
}

