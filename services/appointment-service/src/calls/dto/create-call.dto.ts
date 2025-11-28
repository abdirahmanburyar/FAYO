import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum CallRole {
  HOST = 1,
  PARTICIPANT = 0,
}

export class CreateCallDto {
  @IsString()
  @IsNotEmpty()
  appointmentId: string;

  @IsString()
  @IsNotEmpty()
  userId: string; // Admin/Doctor user ID who is initiating the call

  @IsEnum(CallRole)
  @IsOptional()
  role?: CallRole = CallRole.HOST;
}

