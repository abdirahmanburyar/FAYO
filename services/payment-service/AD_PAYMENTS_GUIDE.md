# Ad Payments Integration Guide

## Overview

The payment service now supports payments for both **appointments** and **ads**. This allows you to monetize advertisements by requiring payment before ads are published.

## Database Changes

### New Fields
- `paymentType` (enum: `APPOINTMENT` | `AD`) - Type of payment
- `adId` (string, optional) - ID of the ad being paid for
- `appointmentId` is now optional (was required)

### Migration

#### Option 1: Using Docker (Recommended)
Run the migration SQL file through Docker:
```bash
# Copy the migration file into the postgres container and execute it
docker cp services/payment-service/add-ad-payments-migration.sql postgres:/tmp/add-ad-payments-migration.sql
docker exec -i postgres psql -U postgres -d fayo -f /tmp/add-ad-payments-migration.sql
```

Or execute directly from your local machine:
```bash
# Execute the migration file directly through Docker
cat services/payment-service/add-ad-payments-migration.sql | docker exec -i postgres psql -U postgres -d fayo
```

#### Option 2: Using Prisma Migrations
If you prefer using Prisma migrations:
```bash
cd services/payment-service
npm run prisma:migrate dev --name add_ad_payments
```

**Note**: The Docker container name is `postgres` and the database name is `fayo`. Adjust these if your setup differs.

## API Endpoints

### Create Ad Payment
```http
POST /api/v1/payments
Content-Type: application/json

{
  "paymentType": "AD",
  "adId": "ad-id-here",
  "amount": 5000,  // Amount in cents (e.g., 5000 = $50.00)
  "paymentMethod": "CARD",
  "currency": "USD",
  "paidBy": "user-id-who-paid",
  "processedBy": "admin-id",
  "notes": "Payment for ad campaign",
  "metadata": {
    "adTitle": "Summer Sale",
    "campaignDuration": "30 days"
  }
}
```

### Get Payments for an Ad
```http
GET /api/v1/payments/ad/:adId
```

### Get All Payments (with filters)
```http
GET /api/v1/payments?adId=xxx&paymentType=AD&paymentStatus=PAID
```

## Integration with Ads Service

### Step 1: Add Payment Requirement to Ad Creation

When creating an ad, you can require payment:

```typescript
// In ads service
async createAd(createAdDto: CreateAdDto) {
  // Calculate ad fee based on duration and price per day
  const adFee = this.calculateAdFee(createAdDto.range, createAdDto.price);
  
  // Create ad with PENDING status
  const ad = await this.prisma.ad.create({
    data: {
      ...createAdDto,
      status: AdStatus.PENDING, // Don't publish until paid
    },
  });
  
  // Return ad with payment information
  return {
    ...ad,
    requiredPayment: adFee,
    paymentStatus: 'PENDING',
  };
}
```

### Step 2: Process Payment and Activate Ad

After payment is received:

```typescript
// In ads service - webhook or endpoint to handle payment confirmation
async activateAdAfterPayment(adId: string, paymentId: string) {
  // Verify payment exists and is paid
  const payment = await paymentService.findOne(paymentId);
  
  if (payment.paymentStatus === 'PAID' && payment.adId === adId) {
    // Activate the ad
    await this.prisma.ad.update({
      where: { id: adId },
      data: {
        status: AdStatus.PUBLISHED,
        startDate: new Date(),
      },
    });
    
    // Emit event
    this.eventEmitter.emit('ad.activated', { adId, paymentId });
  }
}
```

### Step 3: Add Payment Endpoint to Ads Service

```typescript
// In ads controller
@Post(':id/pay')
async payForAd(
@Param('id') id: string,
  @Body() paymentDto: CreateAdPaymentDto,
) {
  // Get ad details
  const ad = await this.adsService.findOne(id);
  
  // Calculate fee based on price per day and range
  const fee = this.calculateAdFee(ad.range, ad.price);
  
  // Create payment via payment service
  const payment = await this.paymentService.create({
    paymentType: 'AD',
    adId: id,
    amount: fee,
    paymentMethod: paymentDto.paymentMethod,
    paidBy: paymentDto.paidBy,
    // ... other fields
  });
  
  // If payment successful, activate ad
  if (payment.paymentStatus === 'PAID') {
    await this.adsService.activateAd(id);
  }
  
  return payment;
}
```

## Payment Flow

1. **Ad Creation**: Admin creates ad → Status: `PENDING`
2. **Payment Required**: System calculates fee based on:
   - Ad duration (range in days)
   - Price per day (in dollars)
   - Formula: `total = price × range` (converted to cents for storage)
3. **Payment Processing**: 
   - User pays via payment service
   - Payment record created with `paymentType: 'AD'`
4. **Ad Activation**: 
   - Payment confirmed → Ad status changes to `PUBLISHED`
   - Ad becomes visible in the app

## Fee Calculation Example

```typescript
function calculateAdFee(range: number, price: number): number {
  // Validate inputs
  const validRange = Math.max(1, Math.floor(range || 1));
  const validPrice = Math.max(0.1, price || 0.1); // Minimum price $0.10/day
  
  // Calculate: price per day × number of days (convert dollars to cents for storage)
  return Math.round(validPrice * 100 * validRange);
}

// Example: $1.50/day × 7 days = $10.50 = 1050 cents
const fee = calculateAdFee(7, 1.5); // Returns 1050
```

## Admin Panel Integration

Add a "Pay for Ad" button in the admin panel:

```typescript
// When admin clicks "Pay for Ad"
const handlePayForAd = async (adId: string) => {
  const ad = await adsApi.getAd(adId);
  const fee = calculateAdFee(ad.range, ad.price);
  
  // Show payment modal
  const payment = await paymentApi.createPayment({
    paymentType: 'AD',
    adId,
    amount: fee,
    paymentMethod: 'CARD',
    // ...
  });
  
  // Refresh ad list
  await fetchAds();
};
```

## Benefits

1. **Monetization**: Generate revenue from advertisements
2. **Flexible Pricing**: Different rates for different ad types and durations
3. **Payment Tracking**: Full payment history for each ad
4. **Refund Support**: Can refund ad payments if needed
5. **Unified System**: Same payment infrastructure for appointments and ads

## Next Steps

1. Run the database migration
2. Update ads service to integrate payment checks
3. Add payment UI to admin panel
4. Add payment confirmation webhooks
5. Update ad creation flow to require payment

