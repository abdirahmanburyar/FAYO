import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, Min, IsArray } from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  specialtyIds: string[];

  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @IsNumber()
  @Min(0)
  experience: number;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  consultationFee?: number;

  @IsString()
  @IsOptional()
  bio?: string;
}
