import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateSpecialtyDto {
  @ApiProperty({ description: 'Specialty name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Specialty description', required: false })
  @IsString()
  @IsOptional()
  description?: string;


  @ApiProperty({ description: 'Whether the specialty is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
