# Waafipay Testing Guide

## Overview

This guide explains how to test the Waafipay integration using the sandbox environment and test data provided by Waafipay.

## Prerequisites

1. **Sandbox API Credentials**: You need to obtain sandbox credentials from Waafipay:
   - `WAAFIPAY_MERCHANT_UID`
   - `WAAFIPAY_API_USER_ID`
   - `WAAFIPAY_API_KEY`

   Contact Waafipay support or visit a WAAFI HQ Office to register for sandbox access.

2. **Test Mobile Wallet Numbers**: Waafipay provides test numbers for different wallet providers (see below).

## Test Data from Waafipay

According to the [Waafipay Quickstart Guide](https://docs.waafipay.com/quickstart), use the following test numbers:

### Test Mobile Wallets

| Wallet Brand        | Provider      | Mobile Number | PIN  |
| ------------------- | ------------- | ------------- | ---- |
| EVCPlus             | Hormuud       | 252611111111  | 1212 |
| ZAAD Service        | Telesom       | 252631111111  | 1212 |
| SAHAL Service       | Golis Telecom | 252901111111  | 1212 |
| WAAFI Djibouti      | WAAFI         | 253771111111  | 1212 |
| WAAFI International | WAAFI         | 9715111111111 | 1212 |

**Note**: These wallet numbers are for testing only and WILL NOT work in production.

### Test Cards

| Network            | Card Number         | Expiration Date | CVV |
| ------------------ | ------------------- | --------------- | --- |
| Visa               | 4111 1111 1111 1111 | 12/28           | 000 |
| MasterCard         | 5555 5555 5555 4444 | 12/28           | 000 |
| Sandbox MasterCard | 5555 5555 5555 5599 | 12/34           | 123 |
| American Express   | 3411 1111 1111 1111 | 12/28           | 000 |

**Note**: These card numbers are for testing purposes only and CAN NOT be used for LIVE transactions.

## Configuration for Testing

### 1. Set Environment Variables

Update your `.env` file or `docker-compose.prod.yml` with sandbox credentials:

```env
# Waafipay Sandbox Configuration
WAAFIPAY_ENV=sandbox
WAAFIPAY_API_URL=https://api.waafipay.com/asm  # Not used in sandbox, but required
WAAFIPAY_MERCHANT_UID=your-sandbox-merchant-uid
WAAFIPAY_API_USER_ID=your-sandbox-api-user-id
WAAFIPAY_API_KEY=your-sandbox-api-key

# QR Code Configuration - Use one of the test mobile wallet numbers
# Option 1: Use phone number (recommended for mobile wallets)
WAAFIPAY_PHONE_NUMBER=+252611111111  # EVCPlus test number

# Option 2: Use account number (if you have a 6-digit test account)
# WAAFIPAY_ACCOUNT_NUMBER=123456
```

### 2. Rebuild and Restart Service

```bash
docker compose -f docker-compose.prod.yml build payment-service
docker compose -f docker-compose.prod.yml up -d payment-service
```

## Testing Flow

### Step 1: Create an Appointment

1. Create an appointment through your application
2. Note the `appointmentId`

### Step 2: Generate QR Code (Optional - for mobile app testing)

```bash
GET /api/v1/waafipay/appointment/{appointmentId}/qr
```

**Response:**
```json
{
  "qrCode": "+252611111111",
  "qrCodeType": "PHONE",
  "appointmentId": "cmip7g1z10005iurqt8ipnzxy",
  "message": "Scan this QR code to initiate payment"
}
```

### Step 3: Initiate Payment

**Using Mobile App:**
1. Open the appointment in the mobile app
2. Tap "Pay Now"
3. Scan the QR code (or manually enter the test phone number)
4. The app will send a payment initiation request

**Using API directly:**
```bash
POST /api/v1/waafipay/initiate
Content-Type: application/json
Authorization: Bearer <your-token>

{
  "appointmentId": "cmip7g1z10005iurqt8ipnzxy",
  "amount": 1200,  // Amount in cents (e.g., $12.00)
  "currency": "USD",
  "phoneNumber": "+252611111111",  // Use test mobile wallet number
  "description": "Payment for appointment test"
}
```

**Expected Response:**
```json
{
  "paymentId": "payment-id",
  "appointmentId": "cmip7g1z10005iurqt8ipnzxy",
  "transactionId": "waafipay-transaction-id",
  "referenceId": "FAYO-cmip7g1z10005iurqt8ipnzxy-1234567890",
  "status": "PENDING",
  "message": "Payment initiated successfully. Waiting for confirmation."
}
```

### Step 4: Simulate Payment Completion

In the sandbox environment, you may need to:
1. **Wait for polling**: The service polls Waafipay every 10 seconds for status updates
2. **Use webhook** (if available in sandbox): Waafipay may send webhook callbacks
3. **Manual status check**: 
   ```bash
   GET /api/v1/waafipay/status/{paymentId}
   ```

### Step 5: Monitor Payment Status

The service will:
- Poll Waafipay API every 10 seconds for up to 15 minutes
- Broadcast status updates via WebSocket
- Publish events via RabbitMQ
- Update payment status in the database

## Testing Scenarios

### Scenario 1: Successful Payment with EVCPlus

1. Use test number: `+252611111111`
2. Initiate payment
3. In sandbox, the payment should be processed automatically or require manual approval
4. Check payment status updates

### Scenario 2: Payment with ZAAD Service

1. Use test number: `+252631111111`
2. Follow the same flow as Scenario 1

### Scenario 3: Payment Failure

1. Use invalid credentials or invalid phone number
2. Verify error handling and error messages

### Scenario 4: QR Code Scanning

1. Generate QR code for an appointment
2. Scan with mobile app
3. Verify payment initiation with scanned data

## Expected Behavior

### Successful Payment Flow

1. ✅ Payment initiated → Status: `PENDING`
2. ✅ Polling starts → Checks status every 10 seconds
3. ✅ Payment confirmed → Status: `PAID`
4. ✅ WebSocket broadcast → Real-time update to clients
5. ✅ RabbitMQ event → Published to message queue
6. ✅ Database updated → Payment record updated

### Error Handling

- **Missing credentials**: Service logs warning, API returns error
- **Invalid phone number**: Validation error before API call
- **API errors**: Handled gracefully, error message returned
- **XML responses**: Parsed and handled correctly
- **Network errors**: Retried by polling service

## Monitoring and Debugging

### Check Logs

```bash
docker logs payment-service -f
```

Look for:
- `💳 Initiating Waafipay payment` - Payment initiation
- `📤 Sending payment request to Waafipay` - API request
- `📥 Waafipay response` - API response
- `⚠️ Waafipay returned XML/HTML response` - XML response handling
- `✅ Payment Polling Service initialized` - Polling started
- `📤 Broadcasted payment.completed` - WebSocket update

### Verify Database

Check the `payments` table:
```sql
SELECT * FROM payments.payments WHERE appointment_id = 'your-appointment-id';
```

### Test WebSocket Connection

Connect to WebSocket endpoint:
```
ws://your-server:3006/api/v1/ws/payments
```

Send message to join:
```json
{
  "type": "join_payment_updates"
}
```

## Troubleshooting

### Issue: "Waafipay credentials not configured"

**Solution**: Set the environment variables:
- `WAAFIPAY_MERCHANT_UID`
- `WAAFIPAY_API_USER_ID`
- `WAAFIPAY_API_KEY`

### Issue: "Unexpected token '<'" error

**Solution**: This means the API returned XML. The new code handles this, but you need to rebuild the service:
```bash
docker compose -f docker-compose.prod.yml build payment-service
docker compose -f docker-compose.prod.yml up -d payment-service
```

### Issue: Payment status not updating

**Check**:
1. Polling service is running (check logs)
2. Waafipay API credentials are correct
3. Transaction ID is valid
4. Network connectivity to Waafipay sandbox

### Issue: Phone number sent as accountNo

**Solution**: Rebuild the service - the fix is in the code but needs to be compiled:
```bash
docker compose -f docker-compose.prod.yml build payment-service
```

## Next Steps

1. ✅ Get sandbox credentials from Waafipay
2. ✅ Configure environment variables
3. ✅ Rebuild payment-service
4. ✅ Test with test mobile wallet numbers
5. ✅ Verify payment flow end-to-end
6. ✅ Test WebSocket updates
7. ✅ Test RabbitMQ events
8. ✅ Move to production when ready

## References

- [Waafipay Quickstart Guide](https://docs.waafipay.com/quickstart)
- [Waafipay API Documentation](https://docs.waafipay.com/)
- [Waafipay GitHub Repository](https://github.com/waafipay) (for code examples)

