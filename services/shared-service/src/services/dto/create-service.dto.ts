import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;


  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
