# Payment Service Deployment Guide

## Docker Compose Configuration

The payment-service has been added to `docker-compose.prod.yml` with the following configuration:

- **Port**: 3006
- **Database**: PostgreSQL (payments schema)
- **Dependencies**: PostgreSQL, RabbitMQ
- **Health Check**: `/api/v1/health`

## Environment Variables

Add the following environment variables to your `.env` file (or set them in docker-compose.prod.yml):

### Required Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/payment_service?schema=payments

# Server
PORT=3006
HOST=0.0.0.0
NODE_ENV=production

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
```

### Waafipay Configuration

#### For Sandbox (Testing)

```env
# Waafipay Sandbox Configuration
WAAFIPAY_ENV=sandbox
WAAFIPAY_API_URL=https://api.waafipay.com/asm
WAAFIPAY_MERCHANT_UID=your-sandbox-merchant-uid
WAAFIPAY_API_USER_ID=your-sandbox-api-user-id
WAAFIPAY_API_KEY=your-sandbox-api-key

# QR Code Configuration (use EITHER account number OR phone number)
WAAFIPAY_ACCOUNT_NUMBER=123456
# OR
WAAFIPAY_PHONE_NUMBER=+252907700949
```

#### For Production

```env
# Waafipay Production Configuration
WAAFIPAY_ENV=production
WAAFIPAY_API_URL=https://api.waafipay.com/asm
WAAFIPAY_MERCHANT_UID=your-production-merchant-uid
WAAFIPAY_API_USER_ID=your-production-api-user-id
WAAFIPAY_API_KEY=your-production-api-key

# QR Code Configuration (use EITHER account number OR phone number)
WAAFIPAY_ACCOUNT_NUMBER=your-production-account-number
# OR
WAAFIPAY_PHONE_NUMBER=+252XXXXXXXXX
```

### Optional Variables

```env
# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://72.62.51.50:3001
ADMIN_PANEL_URL=http://localhost:3000
```

## Deployment Steps

### 1. Configure Environment Variables

Create or update your `.env` file in the project root with the Waafipay credentials:

```bash
# Copy from example
cp services/payment-service/env.example .env

# Edit .env and add your Waafipay credentials
nano .env
```

### 2. Build and Start Services

```bash
# Build payment-service
docker-compose -f docker-compose.prod.yml build payment-service

# Start payment-service
docker-compose -f docker-compose.prod.yml up -d payment-service

# View logs
docker-compose -f docker-compose.prod.yml logs -f payment-service
```

### 3. Verify Deployment

```bash
# Check health
curl http://localhost:3006/api/v1/health

# Check if service is running
docker ps | grep payment-service
```

### 4. Test Waafipay Integration

```bash
# Test QR code generation
curl http://localhost:3006/api/v1/waafipay/appointment/test-appointment-id/qr

# Should return:
# {
#   "qrCode": "123456",
#   "qrCodeType": "ACCOUNT",
#   "appointmentId": "test-appointment-id"
# }
```

## Database Migration

The payment-service will automatically run migrations on startup. If you need to run migrations manually:

```bash
# Enter the container
docker exec -it payment-service sh

# Run migrations
npx prisma migrate deploy
```

## WebSocket Connection

The payment-service exposes WebSocket at:
- **Path**: `/api/v1/ws/payments`
- **Full URL**: `ws://your-domain:3006/api/v1/ws/payments`

## RabbitMQ Events

The service publishes events to RabbitMQ exchange `payments`:
- `payment.waafipay.initiated`
- `payment.waafipay.completed`
- `payment.waafipay.failed`

## Troubleshooting

### Service Won't Start

1. Check logs: `docker-compose -f docker-compose.prod.yml logs payment-service`
2. Verify database connection
3. Check environment variables are set correctly
4. Verify RabbitMQ is running

### Waafipay API Errors

1. Verify credentials are correct
2. Check `WAAFIPAY_ENV` is set correctly (sandbox/production)
3. Verify account number or phone number is configured
4. Check network connectivity to Waafipay API

### WebSocket Not Connecting

1. Verify port 3006 is exposed
2. Check CORS configuration
3. Verify WebSocket path: `/api/v1/ws/payments`

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production Waafipay credentials
- [ ] Set production account number or phone number
- [ ] Configure webhook URL in Waafipay dashboard
- [ ] Enable HTTPS for webhook endpoint
- [ ] Set secure JWT secret
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging
- [ ] Test payment flow end-to-end
- [ ] Verify database backups

## Webhook Configuration

For production, configure the webhook URL in Waafipay dashboard:

```
https://your-domain.com/api/v1/waafipay/webhook
```

The service will automatically process webhooks and update payment status.

