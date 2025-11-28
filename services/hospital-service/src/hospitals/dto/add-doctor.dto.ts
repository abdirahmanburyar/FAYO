import { IsString, IsOptional, IsNumber, IsArray, Min, Matches, ValidateIf } from 'class-validator';

export class AddDoctorDto {
  @IsString()
  @IsOptional()
  role?: string; // CONSULTANT, SENIOR_CONSULTANT, HEAD_OF_DEPARTMENT, RESIDENT, INTERN, GENERAL_PRACTITIONER

  @IsString()
  @IsOptional()
  shift?: string; // e.g., "MORNING", "AFTERNOON", "EVENING", "NIGHT", "FULL_DAY"

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.startTime !== undefined && o.startTime !== null)
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:MM format (24-hour)',
  })
  startTime?: string; // Time format: "09:00" (24-hour format)

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.endTime !== undefined && o.endTime !== null)
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:MM format (24-hour)',
  })
  endTime?: string; // Time format: "17:00" (24-hour format)

  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => o.consultationFee !== undefined && o.consultationFee !== null)
  @Min(0)
  consultationFee?: number; // Consultation fee in cents (specific to this hospital association)

  @IsString()
  @IsOptional()
  status?: string; // ACTIVE, INACTIVE
}

