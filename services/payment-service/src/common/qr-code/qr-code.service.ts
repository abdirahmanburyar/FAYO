import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);
  private readonly accountNumber: string;
  private readonly phoneNumber: string;
  private readonly useAccountNumber: boolean;

  constructor(private readonly configService: ConfigService) {
    this.accountNumber = this.configService.get('WAAFIPAY_ACCOUNT_NUMBER') || '';
    this.phoneNumber = this.configService.get('WAAFIPAY_PHONE_NUMBER') || '';
    
    // Prefer account number if available, otherwise use phone number
    this.useAccountNumber = !!this.accountNumber;
    
    if (!this.accountNumber && !this.phoneNumber) {
      this.logger.warn('⚠️ Waafipay account number or phone number not configured.');
    }
  }

  /**
   * Generate QR code content (account number or phone number)
   */
  generateQrCodeContent(): string {
    if (this.useAccountNumber && this.accountNumber) {
      // Validate account number is 6 digits
      if (!/^\d{6}$/.test(this.accountNumber)) {
        this.logger.warn(`⚠️ Account number "${this.accountNumber}" is not 6 digits. Using phone number instead.`);
        return this.phoneNumber || '';
      }
      return this.accountNumber;
    }
    
    if (this.phoneNumber) {
      // Validate phone number format
      if (!/^\+252\d{9}$/.test(this.phoneNumber)) {
        this.logger.warn(`⚠️ Phone number "${this.phoneNumber}" is not in correct format (+252XXXXXXXXX).`);
      }
      return this.phoneNumber;
    }
    
    this.logger.error('❌ No valid account number or phone number configured for QR code generation.');
    return '';
  }

  /**
   * Get QR code type
   */
  getQrCodeType(): 'ACCOUNT' | 'PHONE' {
    if (this.useAccountNumber && this.accountNumber && /^\d{6}$/.test(this.accountNumber)) {
      return 'ACCOUNT';
    }
    return 'PHONE';
  }

  /**
   * Validate QR code content
   */
  validateQrCodeContent(content: string): { valid: boolean; type?: 'ACCOUNT' | 'PHONE'; error?: string } {
    // Check if it's a 6-digit account number
    if (/^\d{6}$/.test(content)) {
      return { valid: true, type: 'ACCOUNT' };
    }
    
    // Check if it's a phone number
    if (/^\+252\d{9}$/.test(content)) {
      return { valid: true, type: 'PHONE' };
    }
    
    return {
      valid: false,
      error: 'QR code content must be either a 6-digit account number or phone number in format +252XXXXXXXXX',
    };
  }
}

