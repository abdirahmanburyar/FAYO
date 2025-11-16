import { IsEnum, IsOptional } from 'class-validator';

export enum CallParticipantRole {
  HOST = 'HOST',
  AUDIENCE = 'AUDIENCE',
}

export class RequestCallTokenDto {
  @IsOptional()
  @IsEnum(CallParticipantRole)
  role?: CallParticipantRole = CallParticipantRole.HOST;
}

