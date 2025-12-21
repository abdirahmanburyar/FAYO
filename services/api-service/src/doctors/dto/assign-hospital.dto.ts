import { IsString, IsOptional, IsNumber, IsArray, Min, Matches, ValidateIf } from 'class-validator';

export class AssignHospitalDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ValidateIf((o) => o.workingDays !== undefined && o.workingDays !== null)
  workingDays?: string[]; // ["MONDAY", "TUESDAY", etc.]

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.startTime !== undefined && o.startTime !== null)
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:MM format (24-hour)',
  })
  startTime?: string; // "09:00"

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.endTime !== undefined && o.endTime !== null)
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:MM format (24-hour)',
  })
  endTime?: string; // "17:00"

  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => o.consultationFee !== undefined && o.consultationFee !== null)
  @Min(0)
  consultationFee?: number; // in cents
}

