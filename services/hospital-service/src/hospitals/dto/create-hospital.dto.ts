import { IsString, IsOptional, IsBoolean, IsEmail, IsUrl, IsEnum } from 'class-validator';

export class CreateHospitalDto {
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
  @IsBoolean()
  isActive?: boolean = true;
}
