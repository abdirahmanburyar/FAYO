import { IsString, IsOptional, IsObject } from 'class-validator';

export class SendPushDto {
  @IsString()
  deviceToken: string;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
