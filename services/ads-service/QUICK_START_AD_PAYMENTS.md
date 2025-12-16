# Quick Start: Making Payments for Ads

## Simple 3-Step Process

### Step 1: Calculate the Fee
```bash
GET /api/v1/ads/calculate-fee?range=30&type=BANNER
```
Returns: `{ "fee": 4000, "feeInDollars": "40.00" }`

### Step 2: Create the Ad
```bash
POST /api/v1/ads
{
  "company": "Your Company",
  "imageUrl": "/uploads/ads/your-image.jpg",
  "startDate": "2024-01-01",
  "range": 30,
  "type": "BANNER"
}
```
Returns: Ad with `status: "PENDING"` and `requiredFee: 4000`

### Step 3: Pay for the Ad
```bash
POST /api/v1/ads/{adId}/pay
{
  "paymentMethod": "CARD",
  "paidBy": "user-id",
  "processedBy": "admin-id"
}
```
Returns: Payment record and ad automatically activated to `PUBLISHED`

## That's It! 

Once payment is confirmed, the ad is automatically published and appears in the app.

## Fee Examples

| Type | Duration | Calculation | Total |
|------|----------|-------------|-------|
| BANNER | 7 days | $10 + (7 × $1) | $17.00 |
| BANNER | 30 days | $10 + (30 × $1) | $40.00 |
| CAROUSEL | 14 days | $20 + (14 × $2) | $48.00 |
| INTERSTITIAL | 7 days | $50 + (7 × $5) | $85.00 |

## Payment Methods

- `CARD` - Credit/Debit card
- `MOBILE_MONEY` - Mobile money transfer
- `BANK_TRANSFER` - Bank transfer
- `CASH` - Cash payment
- `CHEQUE` - Cheque payment
- `OTHER` - Other methods

## Check Payment Status

```bash
GET /api/v1/ads/{adId}/payments
```

Returns all payments for the ad, including payment status.

