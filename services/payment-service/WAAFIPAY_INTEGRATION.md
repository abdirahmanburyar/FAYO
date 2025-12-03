# Waafipay Integration Documentation

## Overview

This document describes the Waafipay mobile money integration for the FAYO Healthcare payment service. The integration supports QR code-based payments with real-time updates via WebSocket and event publishing via RabbitMQ.

## Architecture

### Flow Diagram

```
1. User Selects Appointment → Generate QR Code
2. User Scans QR Code (Mobile App)
3. Mobile App → POST /api/v1/waafipay/initiate
4. Backend → Waafipay API (Create Payment)
5. User Completes Payment (USSD/Mobile Wallet)
6. Background Polling → Check Payment Status
7. Status Update → WebSocket + RabbitMQ
8. Frontend Receives Real-time Update
```

### Components

1. **WaafipayService** - Handles Waafipay API communication
2. **QrCodeService** - Generates QR codes (account number or phone number)
3. **PaymentPollingService** - Automated status polling (every 10 seconds)
4. **WaafipayGateway** - WebSocket for real-time updates
5. **RabbitMQService** - Event publishing
6. **WaafipayController** - API endpoints

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Waafipay Configuration
WAAFIPAY_ENV=sandbox  # or 'production'
WAAFIPAY_API_URL=https://api.waafipay.com/asm  # Production URL
WAAFIPAY_MERCHANT_UID=your-merchant-uid
WAAFIPAY_API_USER_ID=your-api-user-id
WAAFIPAY_API_KEY=your-api-key

# QR Code Configuration (use either account number OR phone number)
WAAFIPAY_ACCOUNT_NUMBER=123456  # 6 digits
WAAFIPAY_PHONE_NUMBER=+252907700949  # Format: +252XXXXXXXXX

# RabbitMQ (optional)
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

### Sandbox vs Production

- **Sandbox**: Uses `http://sandbox.waafipay.net/asm` automatically when `WAAFIPAY_ENV=sandbox`
- **Production**: Uses `WAAFIPAY_API_URL` when `WAAFIPAY_ENV=production` or `NODE_ENV=production`

## API Endpoints

### 1. Generate QR Code

```http
GET /api/v1/waafipay/appointment/:appointmentId/qr
```

**Response:**
```json
{
  "qrCode": "123456",
  "qrCodeType": "ACCOUNT",
  "appointmentId": "clx123abc456",
  "message": "Scan this QR code to initiate payment"
}
```

### 2. Initiate Payment

```http
POST /api/v1/waafipay/initiate
Content-Type: application/json

{
  "appointmentId": "clx123abc456",
  "amount": 5000,
  "currency": "USD",
  "accountNumber": "123456",  // OR phoneNumber
  "phoneNumber": "+252907700949",  // OR accountNumber
  "description": "Payment for appointment"
}
```

**Response:**
```json
{
  "paymentId": "payment-id",
  "appointmentId": "clx123abc456",
  "transactionId": "waafipay-transaction-id",
  "referenceId": "FAYO-clx123abc456-1234567890",
  "status": "PENDING",
  "message": "Payment initiated successfully. Waiting for confirmation."
}
```

### 3. Check Payment Status

```http
GET /api/v1/waafipay/status/:paymentId
```

**Response:**
```json
{
  "paymentId": "payment-id",
  "appointmentId": "clx123abc456",
  "status": "PAID",
  "transactionId": "waafipay-transaction-id",
  "referenceId": "FAYO-clx123abc456-1234567890",
  "amount": 5000,
  "currency": "USD",
  "message": "Payment completed"
}
```

### 4. Webhook Endpoint (for Waafipay callbacks)

```http
POST /api/v1/waafipay/webhook
Content-Type: application/json

{
  "schemaVersion": "1.0",
  "serviceParams": {
    "transactionId": "...",
    "referenceId": "...",
    "status": "COMPLETED",
    "responseCode": "200"
  }
}
```

## WebSocket Events

Connect to: `ws://localhost:3006/api/v1/ws/payments`

### Events

1. **payment.initiated** - Payment request created
2. **payment.completed** - Payment successful
3. **payment.failed** - Payment failed
4. **payment.cancelled** - Payment cancelled

### Example Client Code

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3006', {
  path: '/api/v1/ws/payments',
});

socket.on('connect', () => {
  socket.emit('join_payment_updates');
});

socket.on('payment.completed', (data) => {
  console.log('Payment completed:', data);
});
```

## RabbitMQ Events

### Exchanges and Routing Keys

- **Exchange**: `payments`
- **Routing Keys**:
  - `payment.waafipay.initiated`
  - `payment.waafipay.completed`
  - `payment.waafipay.failed`

### Event Structure

```json
{
  "type": "payment.waafipay.completed",
  "payment": {
    "id": "payment-id",
    "appointmentId": "appointment-id",
    "amount": 5000,
    "status": "PAID"
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "service": "payment-service"
}
```

## Payment Polling

The system automatically polls Waafipay API every 10 seconds to check payment status:

- **Polling Interval**: 10 seconds
- **Max Duration**: 15 minutes
- **Max Attempts**: 60 attempts
- **Auto-stop**: When payment status is final (COMPLETED/FAILED/CANCELLED)

## QR Code Format

The QR code contains **only** the account number or phone number:

- **Account Number**: `123456` (exactly 6 digits)
- **Phone Number**: `+252907700949` (format: +252XXXXXXXXX)

The mobile app already knows the `appointmentId` from context, so it's not included in the QR code.

## Testing with Sandbox

### Test Credentials

Use Waafipay's test data:

- **EVCPlus (Hormuud)**: `252611111111` (PIN: `1212`)
- **ZAAD (Telesom)**: `252631111111` (PIN: `1212`)
- **SAHAL (Golis)**: `252901111111` (PIN: `1212`)

### Test Flow

1. Set `WAAFIPAY_ENV=sandbox` in `.env`
2. Configure sandbox credentials
3. Generate QR code for appointment
4. Scan QR code in mobile app
5. Initiate payment with test account number
6. Payment will be processed in sandbox
7. Status updates via polling

## Production Deployment

1. Register with Waafipay and get production credentials
2. Update `.env`:
   - `WAAFIPAY_ENV=production`
   - `WAAFIPAY_MERCHANT_UID=<production-uid>`
   - `WAAFIPAY_API_USER_ID=<production-user-id>`
   - `WAAFIPAY_API_KEY=<production-key>`
   - `WAAFIPAY_ACCOUNT_NUMBER=<production-account>` OR `WAAFIPAY_PHONE_NUMBER=<production-phone>`
3. Configure webhook URL in Waafipay dashboard: `https://your-domain.com/api/v1/waafipay/webhook`
4. Restart service

## Error Handling

- **API Errors**: Logged and returned as BadRequestException
- **Polling Errors**: Logged but polling continues (handles temporary network issues)
- **WebSocket Errors**: Gracefully handled, connection auto-reconnects
- **RabbitMQ Errors**: Logged but service continues (RabbitMQ is optional)

## Security Considerations

1. **Credentials**: Store in environment variables, never commit to code
2. **Webhook Verification**: Implement signature verification (if Waafipay provides)
3. **Rate Limiting**: Throttler guards on all endpoints
4. **HTTPS**: Use HTTPS in production for all API calls

## Troubleshooting

### Payment Status Not Updating

1. Check polling service logs
2. Verify Waafipay API credentials
3. Check network connectivity
4. Verify transaction ID and reference ID

### WebSocket Not Connecting

1. Check WebSocket path: `/api/v1/ws/payments`
2. Verify CORS configuration
3. Check firewall settings

### RabbitMQ Not Publishing

1. Check RabbitMQ connection
2. Verify `RABBITMQ_URL` in `.env`
3. Check RabbitMQ service is running

## Next Steps

1. Configure Waafipay sandbox credentials
2. Test QR code generation
3. Test payment initiation
4. Monitor polling and WebSocket updates
5. Test webhook endpoint (if available in sandbox)
6. Deploy to production when ready

