import { IsString, IsOptional, IsBoolean, IsEmail, IsUrl, IsEnum } from 'class-validator';

export enum BookingPolicy {
  HOSPITAL_ASSIGNED = 'HOSPITAL_ASSIGNED',
  DIRECT_DOCTOR = 'DIRECT_DOCTOR',
}

export class CreateHospitalDto {
  @IsString()
  @IsOptional()
  userId?: string; // Reference to user account in user-service

  @IsString()
  name: string;

  @IsEnum(['HOSPITAL', 'CLINIC'])
  type: 'HOSPITAL' | 'CLINIC';

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsEnum(BookingPolicy)
  bookingPolicy?: BookingPolicy;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
