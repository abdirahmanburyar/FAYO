import { IsString, IsEmail } from 'class-validator';

export class SendEmailDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  subject: string;

  @IsString()
  message: string;
}
