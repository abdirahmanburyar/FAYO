import { IsString, IsInt, IsEnum, IsOptional, IsNotEmpty, Min, Matches } from 'class-validator';

export enum WaafipayPaymentMethod {
  MWALLET_ACCOUNT = 'MWALLET_ACCOUNT',
  MWALLET_MSISDN = 'MWALLET_MSISDN',
  CARD = 'CARD',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
}

export class InitiatePaymentDto {
  @IsString()
  @IsNotEmpty()
  appointmentId: string;

  @IsInt()
  @Min(1)
  amount: number; // Amount in cents

  @IsString()
  @IsOptional()
  currency?: string; // Default: USD

  // Optional: accountNumber or phoneNumber (defaults to company account 529988 if not provided)
  @IsString()
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'Account number must be exactly 6 digits' })
  accountNumber?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+252\d{9}$/, { message: 'Phone number must be in format +252XXXXXXXXX' })
  phoneNumber?: string;

  @IsEnum(WaafipayPaymentMethod)
  @IsOptional()
  paymentMethod?: WaafipayPaymentMethod; // Default: MWALLET_ACCOUNT

  @IsString()
  @IsOptional()
  description?: string;
}

