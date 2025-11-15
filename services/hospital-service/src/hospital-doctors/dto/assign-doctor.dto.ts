import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AssignDoctorDto {
  @IsString()
  @IsNotEmpty()
  doctorId: string;

  @IsString()
  @IsOptional()
  role?: string = 'CONSULTANT';
}
