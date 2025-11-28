import { IsString, IsInt, IsEnum, IsOptional, IsNotEmpty, Min } from 'class-validator';

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CHEQUE = 'CHEQUE',
  OTHER = 'OTHER',
}

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  appointmentId: string;

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

