import { IsString, IsPhoneNumber, Length, IsOptional, IsEnum } from 'class-validator';
import { UserRole, UserType, Gender } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @IsPhoneNumber()
  phone: string;

  @IsString()
  @Length(6, 6)
  code: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  // Doctor specific fields
  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  hospital?: string;

  // Patient specific fields
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  address?: string;
}
