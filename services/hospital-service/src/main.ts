import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as cors from 'cors';
import { AppModule } from './app.module';
import { WebSocketServerService } from './websocket/websocket-server';
import { EventEmitter2 } from '@nestjs/event-emitter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('HospitalService');

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

  // CORS configuration - Allow all origins in production for mobile app access
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? true : (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        process.env.ADMIN_PANEL_URL,
        process.env.USER_SERVICE_URL,
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

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
