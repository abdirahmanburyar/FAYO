# How to Make Payments for Ads - Implementation Guide

This guide shows you how to implement ad payments in your ads service.

## Step 1: Install HTTP Client (if not already installed)

The ads service needs to call the payment service. Install `@nestjs/axios`:

```bash
cd services/ads-service
npm install @nestjs/axios axios
```

## Step 2: Create Payment Service Client

Create a new file: `src/payments/payment-client.service.ts`

```typescript
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CHEQUE = 'CHEQUE',
  OTHER = 'OTHER',
}

export interface CreateAdPaymentDto {
  adId: string;
  amount: number; // Amount in cents
  paymentMethod: PaymentMethod;
  currency?: string;
  paidBy?: string;
  processedBy?: string;
  notes?: string;
  transactionId?: string;
}

export interface PaymentResponse {
  id: string;
  paymentType: string;
  adId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  receiptNumber: string;
  paidBy?: string;
  processedBy?: string;
  createdAt: string;
}

@Injectable()
export class PaymentClientService {
  private readonly logger = new Logger(PaymentClientService.name);
  private readonly paymentServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Get payment service URL from environment or use default
    this.paymentServiceUrl =
      this.configService.get<string>('PAYMENT_SERVICE_URL') ||
      'http://payment-service:3006/api/v1';
  }

  /**
   * Create a payment for an ad
   */
  async createAdPayment(createPaymentDto: CreateAdPaymentDto): Promise<PaymentResponse> {
    try {
      this.logger.log(`💳 Creating payment for ad: ${createPaymentDto.adId}`);

      const response = await firstValueFrom(
        this.httpService.post<PaymentResponse>(
          `${this.paymentServiceUrl}/payments`,
          {
            paymentType: 'AD',
            adId: createPaymentDto.adId,
            amount: createPaymentDto.amount,
            paymentMethod: createPaymentDto.paymentMethod,
            currency: createPaymentDto.currency || 'USD',
            paidBy: createPaymentDto.paidBy,
            processedBy: createPaymentDto.processedBy,
            notes: createPaymentDto.notes,
            transactionId: createPaymentDto.transactionId,
          },
        ),
      );

      this.logger.log(`✅ Payment created: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`❌ Error creating payment:`, error);
      throw new HttpException(
        error.response?.data?.message || 'Failed to create payment',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get payments for an ad
   */
  async getAdPayments(adId: string): Promise<PaymentResponse[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<PaymentResponse[]>(
          `${this.paymentServiceUrl}/payments/ad/${adId}`,
        ),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`❌ Error fetching payments:`, error);
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch payments',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check if ad has been paid
   */
  async hasAdBeenPaid(adId: string): Promise<boolean> {
    try {
      const payments = await this.getAdPayments(adId);
      return payments.some((p) => p.paymentStatus === 'PAID');
    } catch (error) {
      this.logger.error(`❌ Error checking payment status:`, error);
      return false;
    }
  }
}
```

## Step 3: Add Payment Module

Create `src/payments/payments.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentClientService } from './payment-client.service';

@Module({
  imports: [HttpModule],
  providers: [PaymentClientService],
  exports: [PaymentClientService],
})
export class PaymentsModule {}
```

## Step 4: Update App Module

Add the PaymentsModule to `src/app.module.ts`:

```typescript
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    // ... other imports
    PaymentsModule,
  ],
  // ...
})
export class AppModule {}
```

## Step 5: Add Fee Calculation Service

Add fee calculation to `src/ads/ads.service.ts`:

```typescript
import { PaymentClientService } from '../payments/payment-client.service';

@Injectable()
export class AdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly paymentClient: PaymentClientService, // Add this
  ) {}

  /**
   * Calculate ad fee based on type and duration
   */
  calculateAdFee(range: number, type?: string): number {
    // Base fees in cents ($10, $20, $50)
    const baseFee = {
      BANNER: 1000,      // $10.00
      CAROUSEL: 2000,    // $20.00
      INTERSTITIAL: 5000, // $50.00
    };

    // Daily rates in cents ($1, $2, $5 per day)
    const dailyRate = {
      BANNER: 100,       // $1.00/day
      CAROUSEL: 200,     // $2.00/day
      INTERSTITIAL: 500, // $5.00/day
    };

    const adType = (type || 'BANNER').toUpperCase();
    const base = baseFee[adType] || baseFee.BANNER;
    const daily = (dailyRate[adType] || dailyRate.BANNER) * range;

    return base + daily; // Total in cents
  }

  /**
   * Activate ad after payment confirmation
   */
  async activateAdAfterPayment(adId: string): Promise<void> {
    const ad = await this.findOne(adId);
    
    if (!ad) {
      throw new NotFoundException(`Ad with ID ${adId} not found`);
    }

    // Check if payment exists and is paid
    const hasPaid = await this.paymentClient.hasAdBeenPaid(adId);
    
    if (!hasPaid) {
      throw new BadRequestException('Ad has not been paid for');
    }

    // Activate the ad
    await this.prisma.ad.update({
      where: { id: adId },
      data: {
        status: AdStatusEnum.PUBLISHED,
        startDate: new Date(), // Start immediately after payment
      },
    });

    // Emit event
    this.eventEmitter.emit('ad.updated', ad);
    this.logger.log(`✅ Ad activated after payment: ${adId}`);
  }
}
```

## Step 6: Add Payment Endpoints to Controller

Update `src/ads/ads.controller.ts`:

```typescript
import { PaymentClientService, PaymentMethod } from '../payments/payment-client.service';

@Controller('ads')
export class AdsController {
  constructor(
    private readonly adsService: AdsService,
    private readonly paymentClient: PaymentClientService, // Add this
  ) {}

  // ... existing endpoints ...

  /**
   * Calculate fee for an ad before creating it
   */
  @Get('calculate-fee')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  calculateFee(
    @Query('range') range: string,
    @Query('type') type?: string,
  ) {
    const rangeNum = parseInt(range, 10);
    if (isNaN(rangeNum) || rangeNum < 1) {
      throw new BadRequestException('Invalid range. Must be a positive number.');
    }
    
    const fee = this.adsService.calculateAdFee(rangeNum, type);
    return {
      range: rangeNum,
      type: type || 'BANNER',
      fee, // in cents
      feeInDollars: (fee / 100).toFixed(2),
    };
  }

  /**
   * Pay for an ad
   */
  @Post(':id/pay')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async payForAd(
    @Param('id') id: string,
    @Body() paymentDto: {
      paymentMethod: PaymentMethod;
      paidBy?: string;
      processedBy?: string;
      notes?: string;
      transactionId?: string;
    },
  ) {
    // Get ad details
    const ad = await this.adsService.findOne(id);
    
    if (!ad) {
      throw new NotFoundException(`Ad with ID ${id} not found`);
    }

    // Calculate fee
    const fee = this.adsService.calculateAdFee(
      Math.ceil((ad.endDate.getTime() - ad.startDate.getTime()) / (1000 * 60 * 60 * 24)),
      ad.type,
    );

    // Create payment
    const payment = await this.paymentClient.createAdPayment({
      adId: id,
      amount: fee,
      paymentMethod: paymentDto.paymentMethod,
      paidBy: paymentDto.paidBy,
      processedBy: paymentDto.processedBy,
      notes: paymentDto.notes,
      transactionId: paymentDto.transactionId,
    });

    // If payment is successful, activate the ad
    if (payment.paymentStatus === 'PAID') {
      await this.adsService.activateAdAfterPayment(id);
    }

    return {
      payment,
      ad: await this.adsService.findOne(id),
    };
  }

  /**
   * Get payments for an ad
   */
  @Get(':id/payments')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  getAdPayments(@Param('id') id: string) {
    return this.paymentClient.getAdPayments(id);
  }
}
```

## Step 7: Update Ad Creation to Require Payment

Modify the `create` method in `ads.service.ts` to always create ads as PENDING:

```typescript
async create(createAdDto: CreateAdDto) {
  const startDate = new Date(createAdDto.startDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + createAdDto.range);

  // Calculate fee
  const fee = this.calculateAdFee(createAdDto.range, createAdDto.type);

  const ad = await this.prisma.ad.create({
    data: {
      title: createAdDto.title || createAdDto.company,
      company: createAdDto.company,
      description: createAdDto.description,
      imageUrl: createAdDto.imageUrl,
      linkUrl: createAdDto.linkUrl,
      type: createAdDto.type || undefined,
      startDate,
      endDate,
      status: AdStatusEnum.PENDING, // Always start as PENDING, require payment
      createdBy: createAdDto.createdBy,
    },
  });

  // Emit event
  this.eventEmitter.emit('ad.created', ad);
  this.logger.log(`✅ Ad created: ${ad.id}, Fee: $${(fee / 100).toFixed(2)}`);

  return {
    ...ad,
    requiredFee: fee,
    requiredFeeInDollars: (fee / 100).toFixed(2),
  };
}
```

## Step 8: Add Environment Variable

Add to `services/ads-service/.env`:

```env
PAYMENT_SERVICE_URL=http://payment-service:3006/api/v1
```

Or in production:
```env
PAYMENT_SERVICE_URL=http://72.62.51.50:3006/api/v1
```

## Usage Examples

### 1. Calculate Fee Before Creating Ad

```bash
GET /api/v1/ads/calculate-fee?range=30&type=BANNER

Response:
{
  "range": 30,
  "type": "BANNER",
  "fee": 4000,  // 30 days * $1/day + $10 base = $40.00
  "feeInDollars": "40.00"
}
```

### 2. Create Ad (Status: PENDING)

```bash
POST /api/v1/ads
{
  "company": "Acme Corp",
  "imageUrl": "/uploads/ads/image.jpg",
  "startDate": "2024-01-01",
  "range": 30,
  "type": "BANNER"
}

Response:
{
  "id": "ad-123",
  "status": "PENDING",
  "requiredFee": 4000,
  "requiredFeeInDollars": "40.00",
  ...
}
```

### 3. Pay for Ad

```bash
POST /api/v1/ads/ad-123/pay
{
  "paymentMethod": "CARD",
  "paidBy": "user-id",
  "processedBy": "admin-id",
  "notes": "Payment for 30-day banner ad"
}

Response:
{
  "payment": {
    "id": "payment-456",
    "adId": "ad-123",
    "amount": 4000,
    "paymentStatus": "PAID",
    "receiptNumber": "001",
    ...
  },
  "ad": {
    "id": "ad-123",
    "status": "PUBLISHED",  // Automatically activated
    ...
  }
}
```

### 4. Check Ad Payments

```bash
GET /api/v1/ads/ad-123/payments

Response:
[
  {
    "id": "payment-456",
    "adId": "ad-123",
    "amount": 4000,
    "paymentStatus": "PAID",
    "receiptNumber": "001",
    "createdAt": "2024-01-01T10:00:00Z"
  }
]
```

## Payment Flow Summary

1. **Admin creates ad** → Status: `PENDING`, fee calculated
2. **Admin pays for ad** → Payment created via payment service
3. **Payment confirmed** → Ad automatically activated to `PUBLISHED`
4. **Ad appears in app** → Users see the paid ad

## Fee Structure

- **BANNER**: $10 base + $1/day
- **CAROUSEL**: $20 base + $2/day  
- **INTERSTITIAL**: $50 base + $5/day

Example: 30-day BANNER ad = $10 + (30 × $1) = **$40.00**

## Next Steps

1. Run the payment service migration (see `AD_PAYMENTS_GUIDE.md`)
2. Implement the code above in your ads service
3. Test the payment flow
4. Update admin panel to show payment button
5. Add payment confirmation UI

