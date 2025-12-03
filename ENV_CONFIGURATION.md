# Environment Configuration for Production Deployment

## Overview

This document lists all environment variables needed for production deployment. Add these to your `.env` file or set them in `docker-compose.prod.yml`.

## Quick Setup

Copy the relevant sections below to your `.env` file and update with your actual values.

## Waafipay Configuration

### Sandbox (Testing)

```env
# Waafipay Sandbox Configuration
WAAFIPAY_ENV=sandbox
WAAFIPAY_API_URL=https://api.waafipay.com/asm
WAAFIPAY_MERCHANT_UID=your-sandbox-merchant-uid
WAAFIPAY_API_USER_ID=your-sandbox-api-user-id
WAAFIPAY_API_KEY=your-sandbox-api-key

# QR Code - Use EITHER account number OR phone number
WAAFIPAY_ACCOUNT_NUMBER=123456
# OR
WAAFIPAY_PHONE_NUMBER=+252907700949
```

### Production

```env
# Waafipay Production Configuration
WAAFIPAY_ENV=production
WAAFIPAY_API_URL=https://api.waafipay.com/asm
WAAFIPAY_MERCHANT_UID=your-production-merchant-uid
WAAFIPAY_API_USER_ID=your-production-api-user-id
WAAFIPAY_API_KEY=your-production-api-key

# QR Code - Use EITHER account number OR phone number
WAAFIPAY_ACCOUNT_NUMBER=your-production-account-number
# OR
WAAFIPAY_PHONE_NUMBER=+252XXXXXXXXX
```

## Complete Environment Variables List

### Database
```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/fayo
```

### JWT
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

### RabbitMQ
```env
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
```

### Service URLs (Internal - Docker)
```env
USER_SERVICE_URL=http://user-service:3001
HOSPITAL_SERVICE_URL=http://hospital-service:3002
DOCTOR_SERVICE_URL=http://doctor-service:3003
SPECIALTY_SERVICE_URL=http://specialty-service:3004
APPOINTMENT_SERVICE_URL=http://appointment-service:3005
PAYMENT_SERVICE_URL=http://payment-service:3006
```

### Service URLs (External - Browser)
```env
NEXT_PUBLIC_USER_SERVICE_URL=http://72.62.51.50:3001
NEXT_PUBLIC_HOSPITAL_SERVICE_URL=http://72.62.51.50:3002
NEXT_PUBLIC_DOCTOR_SERVICE_URL=http://72.62.51.50:3003
NEXT_PUBLIC_SPECIALTY_SERVICE_URL=http://72.62.51.50:3004
NEXT_PUBLIC_APPOINTMENT_SERVICE_URL=http://72.62.51.50:3005
NEXT_PUBLIC_PAYMENT_SERVICE_URL=http://72.62.51.50:3006
NEXT_PUBLIC_API_URL=http://72.62.51.50:3001/api/v1
```

### CORS
```env
ALLOWED_ORIGINS=http://localhost:3000,http://72.62.51.50:3001
ADMIN_PANEL_URL=http://localhost:3000
```

### OTP
```env
OTP_EXPIRES_IN=300000
OTP_LENGTH=6
```

### Email
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME=FAYO Healthcare
DEFAULT_EMAIL=your-email@gmail.com
```

### Zoom (Optional)
```env
ZOOM_SDK_KEY=
ZOOM_SDK_SECRET=
```

## Payment Service Specific

The payment-service requires these additional variables (already configured in docker-compose.prod.yml):

```env
# Server
PORT=3006
HOST=0.0.0.0
NODE_ENV=production

# Database (for payment-service)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/payment_service?schema=payments

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# Waafipay (see above)
WAAFIPAY_ENV=sandbox
WAAFIPAY_MERCHANT_UID=...
WAAFIPAY_API_USER_ID=...
WAAFIPAY_API_KEY=...
WAAFIPAY_ACCOUNT_NUMBER=... OR WAAFIPAY_PHONE_NUMBER=...
```

## How to Set Environment Variables

### Option 1: .env File (Recommended)

Create a `.env` file in the project root:

```bash
# Create .env file
touch .env

# Add variables
nano .env
```

Docker Compose will automatically load variables from `.env` file.

### Option 2: Docker Compose Environment

Set variables directly in `docker-compose.prod.yml`:

```yaml
environment:
  WAAFIPAY_MERCHANT_UID: your-actual-uid
  WAAFIPAY_API_USER_ID: your-actual-user-id
  WAAFIPAY_API_KEY: your-actual-key
```

### Option 3: Export in Shell

```bash
export WAAFIPAY_MERCHANT_UID=your-actual-uid
export WAAFIPAY_API_USER_ID=your-actual-user-id
export WAAFIPAY_API_KEY=your-actual-key
```

## Security Notes

1. **Never commit `.env` file** to version control
2. **Use strong secrets** for JWT_SECRET in production
3. **Rotate API keys** regularly
4. **Use different credentials** for sandbox and production
5. **Restrict access** to `.env` file (chmod 600)

## Verification

After setting environment variables, verify they're loaded:

```bash
# Check if payment-service can access variables
docker exec payment-service env | grep WAAFIPAY

# Should show:
# WAAFIPAY_ENV=sandbox
# WAAFIPAY_MERCHANT_UID=...
# etc.
```

## Next Steps

1. Set Waafipay credentials in `.env` file
2. Configure account number or phone number
3. Restart payment-service: `docker-compose -f docker-compose.prod.yml restart payment-service`
4. Test QR code generation
5. Test payment initiation

