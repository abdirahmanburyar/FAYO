import { CallType } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateCallSessionDto {
  @IsOptional()
  @IsString()
  recipientId?: string;

  @IsOptional()
  @IsEnum(CallType)
  callType?: CallType = CallType.VIDEO;

  @IsOptional()
  @IsString()
  channelName?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

