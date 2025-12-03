export interface WaafipayCallbackDto {
  schemaVersion?: string;
  requestId?: string;
  timestamp?: string;
  channelName?: string;
  serviceName?: string;
  serviceParams?: {
    responseCode?: string;
    responseMsg?: string;
    transactionId?: string;
    referenceId?: string;
    merchantUid?: string;
    amount?: string;
    currency?: string;
    paymentMethod?: string;
    status?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

