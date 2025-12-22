// PM2 Ecosystem Configuration for FAYO Application
// Run: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'fayo-api-service',
      script: './dist/main.js',
      cwd: './services/api-service',
      instances: 1, // Single instance for now (can increase if needed)
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=384',
        PORT: 3001,
        HOST: '0.0.0.0',
        // Database - Direct PostgreSQL installation (no Docker)
        // Include all schemas in the connection string
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fayo?schema=public&schema=users&schema=hospitals&schema=appointments&schema=payments&schema=ads',
        // Redis
        REDIS_HOST: process.env.REDIS_HOST || 'localhost',
        REDIS_PORT: process.env.REDIS_PORT || 6379,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
        // RabbitMQ
        RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
        // JWT
        JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
        // OTP
        OTP_EXPIRES_IN: process.env.OTP_EXPIRES_IN || '300000',
        OTP_LENGTH: process.env.OTP_LENGTH || '6',
        // Email
        MAIL_MAILER: process.env.MAIL_MAILER || 'smtp',
        MAIL_HOST: process.env.MAIL_HOST || 'smtp.gmail.com',
        MAIL_PORT: process.env.MAIL_PORT || '587',
        MAIL_USERNAME: process.env.MAIL_USERNAME || 'buryar313@gmail.com',
        MAIL_PASSWORD: process.env.MAIL_PASSWORD || 'fjmnakpupnytzsah',
        MAIL_ENCRYPTION: process.env.MAIL_ENCRYPTION || 'tls',
        MAIL_FROM_ADDRESS: process.env.MAIL_FROM_ADDRESS || 'buryar313@gmail.com',
        MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'FAYO Healthcare',
        DEFAULT_EMAIL: process.env.DEFAULT_EMAIL || 'buryar313@gmail.com',
        // Zoom
        ZOOM_SDK_KEY: process.env.ZOOM_SDK_KEY || '',
        ZOOM_SDK_SECRET: process.env.ZOOM_SDK_SECRET || '',
        // Payment
        ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://72.62.51.50:3000',
        ADMIN_PANEL_URL: process.env.ADMIN_PANEL_URL || 'http://localhost:3000',
        // Waafipay
        WAAFIPAY_ENV: process.env.WAAFIPAY_ENV || 'sandbox',
        WAAFIPAY_API_URL: process.env.WAAFIPAY_API_URL || 'https://api.waafipay.com/asm',
        // Firebase Cloud Messaging (FCM)
        // Option 1: Place firebase-service-account.json in services/api-service/ directory
        // Option 2: Set FIREBASE_SERVICE_ACCOUNT as JSON string (recommended for production)
        // Get from Firebase Console > Project Settings > Service Accounts > Generate New Private Key
        FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT || '',
        WAAFIPAY_MERCHANT_UID: process.env.WAAFIPAY_MERCHANT_UID || 'M0913664',
        WAAFIPAY_API_USER_ID: process.env.WAAFIPAY_API_USER_ID || '1007468',
        WAAFIPAY_API_KEY: process.env.WAAFIPAY_API_KEY || 'API-1101188487AHX',
        WAAFIPAY_ACCOUNT_NUMBER: process.env.WAAFIPAY_ACCOUNT_NUMBER || '',
        WAAFIPAY_PHONE_NUMBER: process.env.WAAFIPAY_PHONE_NUMBER || '',
        SERVICE_NAME: 'api-service',
      },
      error_file: './logs/api-service-error.log',
      out_file: './logs/api-service-out.log',
      log_file: './logs/api-service.log',
      time: true,
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
    },
    {
      name: 'fayo-admin-panel',
      script: 'npm',
      args: 'start',
      cwd: './web/admin-panel',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=256',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        // Server-side URLs (for API routes)
        API_SERVICE_URL: process.env.API_SERVICE_URL || 'http://localhost:3001',
        // Client-side URLs (for browser)
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://72.62.51.50:3001/api/v1',
        NEXT_TELEMETRY_DISABLED: '1',
      },
      error_file: './logs/admin-panel-error.log',
      out_file: './logs/admin-panel-out.log',
      log_file: './logs/admin-panel.log',
      time: true,
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '400M',
      watch: false,
      ignore_watch: ['node_modules', '.next', 'logs', '.git'],
    },
  ],
};

