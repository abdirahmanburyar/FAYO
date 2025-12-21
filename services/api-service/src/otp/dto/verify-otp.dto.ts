import { IsString, IsPhoneNumber, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsPhoneNumber()
  phone: string;

  @IsString()
  @Length(6, 6)
  code: string;
}

