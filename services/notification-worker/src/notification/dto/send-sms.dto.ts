import { IsString, IsPhoneNumber } from 'class-validator';

export class SendSmsDto {
  @IsString()
  @IsPhoneNumber()
  phone: string;

  @IsString()
  message: string;
}
