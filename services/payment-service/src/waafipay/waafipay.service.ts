import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InitiatePaymentDto, WaafipayPaymentMethod } from './dto/initiate-payment.dto';
import { WaafipayCallbackDto } from './dto/waafipay-callback.dto';
import { WaafipayPaymentStatus } from './dto/payment-status.dto';

@Injectable()
export class WaafipayService {
  private readonly logger = new Logger(WaafipayService.name);
  private readonly apiUrl: string;
  private readonly merchantUid: string;
  private readonly apiUserId: string;
  private readonly apiKey: string;
  private readonly isSandbox: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isSandbox = this.configService.get('WAAFIPAY_ENV') === 'sandbox' || 
                     this.configService.get('NODE_ENV') !== 'production';
    
    this.apiUrl = this.isSandbox
      ? 'http://sandbox.waafipay.net/asm'
      : this.configService.get('WAAFIPAY_API_URL') || 'https://api.waafipay.com/asm';
    
    this.merchantUid = this.configService.get('WAAFIPAY_MERCHANT_UID') || '';
    this.apiUserId = this.configService.get('WAAFIPAY_API_USER_ID') || '';
    this.apiKey = this.configService.get('WAAFIPAY_API_KEY') || '';

    if (!this.merchantUid || !this.apiUserId || !this.apiKey) {
      this.logger.warn('⚠️ Waafipay credentials not configured. Payment operations will fail.');
    }
  }

  /**
   * Initiate a payment with Waafipay
   */
  async initiatePayment(dto: InitiatePaymentDto): Promise<any> {
    try {
      this.logger.log(`💳 Initiating Waafipay payment for appointment: ${dto.appointmentId}`);

      // Validate that either accountNumber or phoneNumber is provided
      if (!dto.accountNumber && !dto.phoneNumber) {
        throw new BadRequestException('Either accountNumber or phoneNumber must be provided');
      }

      // Generate unique reference ID
      const referenceId = `FAYO-${dto.appointmentId}-${Date.now()}`;

      // Prepare payer info
      const payerInfo: any = {};
      if (dto.accountNumber) {
        payerInfo.accountNo = dto.accountNumber;
      } else if (dto.phoneNumber) {
        payerInfo.accountNo = dto.phoneNumber.replace('+', ''); // Remove + for API
      }

      // Prepare transaction info
      const amount = (dto.amount / 100).toFixed(2); // Convert cents to dollars
      const transactionInfo = {
        amount: amount,
        currency: dto.currency || 'USD',
        referenceId: referenceId,
        description: dto.description || `Payment for appointment ${dto.appointmentId}`,
      };

      // Prepare request payload
      const requestPayload = {
        schemaVersion: '1.0',
        requestId: `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 23),
        channelName: 'WEB',
        serviceName: 'API_PURCHASE',
        serviceParams: {
          merchantUid: this.merchantUid,
          apiUserId: this.apiUserId,
          apiKey: this.apiKey,
          paymentMethod: dto.paymentMethod || WaafipayPaymentMethod.MWALLET_ACCOUNT,
          payerInfo: payerInfo,
          transactionInfo: transactionInfo,
        },
      };

      this.logger.log(`📤 Sending payment request to Waafipay: ${this.apiUrl}`);
      this.logger.debug(`Request payload: ${JSON.stringify(requestPayload, null, 2)}`);

      // Make API request
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const responseData = await response.json();
      
      this.logger.log(`📥 Waafipay response: ${JSON.stringify(responseData, null, 2)}`);

      if (!response.ok) {
        throw new BadRequestException(
          `Waafipay API error: ${responseData.serviceParams?.responseMsg || response.statusText}`
        );
      }

      // Check response code
      const responseCode = responseData.serviceParams?.responseCode;
      if (responseCode && responseCode !== '200' && responseCode !== '0') {
        throw new BadRequestException(
          `Waafipay payment failed: ${responseData.serviceParams?.responseMsg || 'Unknown error'}`
        );
      }

      return {
        transactionId: responseData.serviceParams?.transactionId,
        referenceId: referenceId,
        status: responseData.serviceParams?.status || 'PENDING',
        responseCode: responseCode,
        responseMsg: responseData.serviceParams?.responseMsg,
        amount: dto.amount,
        currency: dto.currency || 'USD',
      };
    } catch (error) {
      this.logger.error(`❌ Error initiating Waafipay payment:`, error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to initiate payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId: string, referenceId: string): Promise<any> {
    try {
      this.logger.log(`🔍 Checking payment status for transaction: ${transactionId}`);

      const requestPayload = {
        schemaVersion: '1.0',
        requestId: `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 23),
        channelName: 'WEB',
        serviceName: 'API_TRANSACTION_INQUIRY',
        serviceParams: {
          merchantUid: this.merchantUid,
          apiUserId: this.apiUserId,
          apiKey: this.apiKey,
          transactionId: transactionId,
          referenceId: referenceId,
        },
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const responseData = await response.json();
      
      this.logger.log(`📥 Waafipay status response: ${JSON.stringify(responseData, null, 2)}`);

      return {
        transactionId: responseData.serviceParams?.transactionId,
        referenceId: responseData.serviceParams?.referenceId,
        status: responseData.serviceParams?.status,
        responseCode: responseData.serviceParams?.responseCode,
        responseMsg: responseData.serviceParams?.responseMsg,
        amount: responseData.serviceParams?.amount,
        currency: responseData.serviceParams?.currency,
      };
    } catch (error) {
      this.logger.error(`❌ Error checking payment status:`, error);
      throw new BadRequestException(
        `Failed to check payment status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Process webhook callback from Waafipay
   */
  processWebhook(callback: WaafipayCallbackDto): any {
    this.logger.log(`📥 Processing Waafipay webhook: ${JSON.stringify(callback, null, 2)}`);

    const serviceParams = callback.serviceParams || {};
    
    return {
      transactionId: serviceParams.transactionId,
      referenceId: serviceParams.referenceId,
      status: serviceParams.status,
      responseCode: serviceParams.responseCode,
      responseMsg: serviceParams.responseMsg,
      amount: serviceParams.amount,
      currency: serviceParams.currency,
      paymentMethod: serviceParams.paymentMethod,
    };
  }
}

