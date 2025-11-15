import { IsString, IsPhoneNumber } from 'class-validator';

export class GenerateOtpDto {
  @IsString()
  @IsPhoneNumber()
  phone: string;
}
