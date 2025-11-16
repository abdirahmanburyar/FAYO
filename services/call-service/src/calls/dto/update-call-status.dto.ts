import { CallStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateCallStatusDto {
  @IsEnum(CallStatus)
  status: CallStatus;
}

