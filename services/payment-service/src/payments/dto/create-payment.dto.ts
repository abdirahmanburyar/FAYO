import { IsString, IsInt, IsEnum, IsOptional, IsNotEmpty, Min, ValidateIf } from 'class-validator';

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CHEQUE = 'CHEQUE',
  OTHER = 'OTHER',
}

export enum PaymentType {
  APPOINTMENT = 'APPOINTMENT',
  AD = 'AD',
}

export class CreatePaymentDto {
  @IsEnum(PaymentType)
  @IsOptional()
  paymentType?: PaymentType; // Defaults to APPOINTMENT for backward compatibility

  @IsString()
  @ValidateIf((o) => o.paymentType === PaymentType.APPOINTMENT || !o.paymentType)
  @IsNotEmpty()
  appointmentId?: string;

  @IsString()
  @ValidateIf((o) => o.paymentType === PaymentType.AD)
  @IsNotEmpty()
  adId?: string;

  @IsInt()
  @Min(1)
  amount: number; // Amount in cents

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  paidBy?: string; // User ID who made the payment

  @IsString()
  @IsOptional()
  processedBy?: string; // Admin/staff ID who processed the payment

  @IsOptional()
  metadata?: any; // Additional payment metadata
}

