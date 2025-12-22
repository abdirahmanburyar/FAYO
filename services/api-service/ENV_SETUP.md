# Environment Variables Setup

Copy this template to create your `.env` file:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fayo?schema=public&schema=users&schema=hospitals&schema=appointments&schema=payments&schema=ads

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# OTP
OTP_EXPIRES_IN=300000
OTP_LENGTH=6

# Email
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME=FAYO Healthcare
DEFAULT_EMAIL=your-email@gmail.com

# Zoom
ZOOM_SDK_KEY=
ZOOM_SDK_SECRET=

# Payment
ALLOWED_ORIGINS=http://localhost:3000,http://72.62.51.50:3000
ADMIN_PANEL_URL=http://localhost:3000

# Waafipay
WAAFIPAY_ENV=sandbox
WAAFIPAY_API_URL=https://api.waafipay.com/asm
WAAFIPAY_MERCHANT_UUID=
WAAFIPAY_API_KEY=
WAAFIPAY_API_SECRET=

# Firebase Cloud Messaging (FCM)
# Option 1: Place firebase-service-account.json file in the api-service root directory
# Option 2: Set FIREBASE_SERVICE_ACCOUNT as a JSON string (for production)
# Get the service account JSON from Firebase Console > Project Settings > Service Accounts
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

## Firebase Setup

See `FIREBASE_SETUP.md` for detailed Firebase credentials setup instructions.

