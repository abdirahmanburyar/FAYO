import { IsString, IsOptional, IsNumber, Min, Matches, ValidateIf } from 'class-validator';

export class AddDoctorDto {
  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  shift?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.startTime !== undefined && o.startTime !== null)
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:MM format (24-hour)',
  })
  startTime?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.endTime !== undefined && o.endTime !== null)
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:MM format (24-hour)',
  })
  endTime?: string;

  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => o.consultationFee !== undefined && o.consultationFee !== null)
  @Min(0)
  consultationFee?: number;

  @IsString()
  @IsOptional()
  status?: string;
}

