# Admin Panel - Ad Payments Integration

## Summary

The admin panel has been updated to support ad payments. Admins can now:
- View payment status for each ad
- Calculate fees before creating ads
- Make payments for ads
- View payment history

## Changes Made

### 1. Payment API Service (`src/services/paymentApi.ts`)
- ✅ Added `paymentType` field to Payment interface
- ✅ Added `adId` field to Payment interface
- ✅ Added `getPaymentsByAd()` method
- ✅ Updated `getAllPayments()` to filter by `adId` and `paymentType`

### 2. Ads API Service (`src/services/adsApi.ts`)
- ✅ Added `type` field to `CreateAdDto` interface
- ✅ Added `calculateFee()` method
- ✅ Added `payForAd()` method
- ✅ Added `getAdPayments()` method

### 3. Payment Modal Component (`src/components/AdPaymentModal.tsx`)
- ✅ New component for handling ad payments
- ✅ Shows fee calculation
- ✅ Displays payment history
- ✅ Payment form with method selection
- ✅ Shows payment status

### 4. Ads List Page (`src/app/admin/ads/page.tsx`)
- ✅ Added payment status indicator (Paid/Payment Required)
- ✅ Added "Pay for Ad" button
- ✅ Integrated payment modal
- ✅ Loads payment history for each ad

### 5. Create Ad Page (`src/app/admin/ads/create/page.tsx`)
- ✅ Added ad type selector (Banner/Carousel/Interstitial)
- ✅ Real-time fee calculation display
- ✅ Fee breakdown showing base + daily rates
- ✅ Added "PENDING" status option (requires payment)

## Features

### Payment Status Display
- **Green badge**: Shows "Paid" with total amount for ads that have been paid
- **Yellow badge**: Shows "Payment Required" for unpaid ads

### Fee Calculation
- Automatically calculates fee based on:
  - Ad type (Banner/Carousel/Interstitial)
  - Duration (number of days)
- Formula:
  - **Banner**: $10 base + $1/day
  - **Carousel**: $20 base + $2/day
  - **Interstitial**: $50 base + $5/day

### Payment Flow
1. Admin creates ad → Status: `PENDING`
2. Admin clicks "Pay for Ad" button
3. Payment modal opens showing:
   - Calculated fee
   - Payment method selection
   - Transaction ID (optional)
   - Notes (optional)
4. Admin submits payment
5. Ad automatically changes to `PUBLISHED` status
6. Payment history is displayed

## Usage

### Making a Payment
1. Navigate to Ads page (`/admin/ads`)
2. Find the ad you want to pay for
3. Click the green "Pay for Ad" button
4. Select payment method
5. Enter transaction ID (if available)
6. Add notes (optional)
7. Click "Pay $XX.XX"
8. Ad will be automatically published

### Viewing Payment History
- Click "Pay for Ad" on any ad
- Payment history is shown in the modal
- Shows all payments (paid, refunded, etc.)

## API Endpoints Used

- `GET /api/v1/ads/calculate-fee?range=X&type=Y` - Calculate fee
- `POST /api/v1/ads/{id}/pay` - Pay for ad
- `GET /api/v1/ads/{id}/payments` - Get ad payments
- `GET /api/v1/payments/ad/{adId}` - Get payments by ad ID
- `POST /api/v1/payments` - Create payment (with `paymentType: 'AD'`)

## Notes

- Payment API uses relative URLs (goes through Next.js API routes or proxy)
- Ensure payment service is running on port 3006
- Ads with status `PENDING` require payment before being published
- Once paid, ads automatically change to `PUBLISHED` status

