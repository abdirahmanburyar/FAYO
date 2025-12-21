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
  paymentType?: PaymentType;

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
  amount: number;

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
  paidBy?: string;

  @IsString()
  @IsOptional()
  processedBy?: string;

  @IsOptional()
  metadata?: any;
}

