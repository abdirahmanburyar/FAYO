import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { WebSocketServerService } from './websocket/websocket-server';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('HospitalService');

  // Serve static files from /app/uploads
  // This corresponds to the volume mounted in docker-compose
  app.useStaticAssets('/app/uploads', {
    prefix: '/uploads/',
  });

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration - Allow all origins in production for mobile app and admin panel access
  app.enableCors({
    origin: (origin, callback) => {
      // In production, allow all origins (for mobile app and admin panel)
      if (process.env.NODE_ENV === 'production') {
        callback(null, true);
        return;
      }
      
      // In development, restrict to localhost and configured origins
      const allowedOrigins = [
        'http://localhost:3000', // Admin panel
        'http://72.62.51.50:3001', // Hospital panel (Next.js)
        'http://localhost:3002', // Hospital service
        'http://localhost:3003', // Doctor service
        'http://localhost:3004', // Specialty service
        'http://localhost:3005', // Appointment service
        'http://localhost:3006', // Payment service
        process.env.ADMIN_PANEL_URL,
        process.env.HOSPITAL_PANEL_URL,
        process.env.USER_SERVICE_URL,
        ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
      ].filter(Boolean);
      
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: process.env.NODE_ENV === 'production',
  }));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Trust proxy for rate limiting
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  const port = configService.get('PORT') || 3002;
  const server = await app.listen(port);
  
  // Initialize WebSocket server
  const webSocketServer = new WebSocketServerService(server);
  
  // Store the WebSocket server instance globally so services can access it
  app.getHttpAdapter().getInstance().set('webSocketServer', webSocketServer);
  
  // Also store in global variable for health controller access
  (global as any).webSocketServer = webSocketServer;
  
  logger.log(`🏥 Hospital Service running on 0.0.0.0:${port}`);
}

bootstrap();
