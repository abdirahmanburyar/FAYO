import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateDoctorRoleDto {
  @IsString()
  @IsNotEmpty()
  role: string;
}
