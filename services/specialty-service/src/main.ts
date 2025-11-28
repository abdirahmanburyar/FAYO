import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('SpecialtyService');
  
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
  
  // CORS configuration - Allow all origins for microservice access
  app.enableCors({
    origin: (origin, callback) => {
      // In production, allow all origins (for microservices and admin panel)
      if (process.env.NODE_ENV === 'production') {
        callback(null, true);
        return;
      }
      
      // In development, restrict to localhost and configured origins
      const allowedOrigins = [
        'http://localhost:3000', // Admin panel
        'http://31.97.58.62:3001', // Hospital panel (Next.js)
        'http://localhost:3002', // Hospital service
        'http://localhost:3003', // Doctor service
        'http://localhost:3004', // Specialty service
        'http://localhost:3005', // Appointment service
        'http://localhost:3006', // Payment service
        process.env.ADMIN_PANEL_URL,
        process.env.HOSPITAL_PANEL_URL,
        process.env.DOCTOR_SERVICE_URL,
        process.env.HOSPITAL_SERVICE_URL,
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
  
  const port = configService.get('PORT') || 3004;
  const host = configService.get('HOST') || '0.0.0.0';
  await app.listen(port, host);
  
  logger.log(`🏥 Specialty Service running on ${host}:${port}`);
}
bootstrap();

