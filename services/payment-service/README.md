# Payment Service

Microservice for handling offline and online payments for appointments in the FAYO Healthcare system.

## Overview

The payment service manages payment processing, tracking, and refunds for appointments. It supports multiple payment methods including cash, card, bank transfer, mobile money, cheque, and other offline methods.

## Features

- ✅ Create payment records
- ✅ Process payments (mark as completed)
- ✅ Track payment status
- ✅ Support multiple payment methods (Cash, Card, Bank Transfer, Mobile Money, Cheque, Other)
- ✅ Generate receipt numbers
- ✅ Refund payments
- ✅ Payment history tracking
- ✅ Integration with appointment service
- ✅ Kafka event publishing

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Kafka (optional, for event streaming)

### Installation

1. **Install dependencies**
   ```bash
   cd services/payment-service
   npm install
   ```

2. **Configure environment**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/fayo_healthcare?schema=payments
   PORT=3006
   KAFKA_BROKER=localhost:9092
   ```

3. **Set up database**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run migrations
   npm run prisma:migrate
   ```

4. **Start the service**
   ```bash
   npm run start:dev
   ```

The service will run on `http://localhost:3006`

## API Endpoints

### Create Payment
```
POST /api/v1/payments
```

Request body:
```json
{
  "appointmentId": "string",
  "amount": 5000,  // Amount in cents
  "paymentMethod": "CASH",
  "currency": "NGN",
  "notes": "Optional notes",
  "processedBy": "admin-user-id"
}
```

### Process Payment (Mark as Completed)
```
PATCH /api/v1/payments/:id/process
```

Request body:
```json
{
  "processedBy": "admin-user-id"
}
```

### Get Payments by Appointment
```
GET /api/v1/payments/appointment/:appointmentId
```

### Get Payment by ID
```
GET /api/v1/payments/:id
```

### Refund Payment
```
PATCH /api/v1/payments/:id/refund
```

Request body:
```json
{
  "refundReason": "Patient cancelled",
  "refundedBy": "admin-user-id"
}
```

### Get All Payments (with filters)
```
GET /api/v1/payments?appointmentId=xxx&paymentStatus=COMPLETED&paymentMethod=CASH
```

## Payment Methods

- `CASH` - Cash payment
- `CARD` - Card/debit card payment
- `BANK_TRANSFER` - Bank transfer
- `MOBILE_MONEY` - Mobile money (e.g., MTN, Airtel)
- `CHEQUE` - Cheque payment
- `OTHER` - Other payment methods

## Payment Status

- `PENDING` - Payment created but not yet processed
- `COMPLETED` - Payment successfully processed
- `FAILED` - Payment failed
- `REFUNDED` - Payment was refunded
- `CANCELLED` - Payment was cancelled

## Database Schema

The service uses a `payments` schema in PostgreSQL with the following main model:

- `Payment` - Payment records with fields for amount, method, status, receipt number, etc.

## Integration with Admin Panel

The admin panel has a "Pay" button that opens a payment modal where admins can:
1. Enter payment amount
2. Select payment method
3. Add notes
4. Process the payment

The payment is automatically linked to the appointment and updates the appointment's payment status.

## Kafka Events

The service publishes the following Kafka events:

- `payment.completed` - When a payment is successfully processed
- `payment.failed` - When a payment fails

## Docker

Build and run with Docker:

```bash
docker build -t fayo-payment-service .
docker run -p 3006:3006 --env-file .env fayo-payment-service
```

## Development

```bash
# Development mode with hot reload
npm run start:dev

# Production build
npm run build
npm run start:prod

# Run Prisma Studio (database GUI)
npm run prisma:studio
```

