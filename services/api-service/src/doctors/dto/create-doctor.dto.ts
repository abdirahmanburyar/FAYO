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
  selfEmployedConsultationFee?: number; // Self-employed consultation fee in cents

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  // Professional Information
  @IsString()
  @IsOptional()
  education?: string;

  @IsString()
  @IsOptional()
  certifications?: string; // JSON array string

  @IsString()
  @IsOptional()
  languages?: string; // JSON array string

  @IsString()
  @IsOptional()
  awards?: string; // JSON array string

  @IsString()
  @IsOptional()
  publications?: string; // JSON array string

  @IsString()
  @IsOptional()
  memberships?: string; // JSON array string

  @IsString()
  @IsOptional()
  researchInterests?: string;
}

