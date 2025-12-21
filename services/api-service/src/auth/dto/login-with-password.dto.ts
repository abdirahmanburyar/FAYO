import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginWithPasswordDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

