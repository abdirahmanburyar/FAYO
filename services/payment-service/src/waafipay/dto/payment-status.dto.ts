export enum WaafipayPaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface PaymentStatusResponse {
  paymentId: string;
  appointmentId: string;
  status: WaafipayPaymentStatus;
  transactionId?: string;
  referenceId?: string;
  amount: number;
  currency: string;
  message?: string;
  timestamp: string;
}

