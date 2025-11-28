import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('AppointmentService');
  
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
  
  // CORS configuration - Allow all origins (no restrictions)
  app.enableCors({
    origin: true, // Allow all origins - more reliable than '*'
    credentials: false, // Set to false when allowing all origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  
  logger.log('✅ CORS enabled - allowing all origins (true)');
  
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
  
  const port = configService.get('PORT') || 3005;
  const host = configService.get('HOST') || '0.0.0.0';
  await app.listen(port, host);
  
  logger.log(`📅 Appointment Service running on ${host}:${port}`);
}
bootstrap();

