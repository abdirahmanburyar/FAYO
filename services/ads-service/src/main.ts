import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Ensure uploads directory exists
  const uploadsPath = '/app/uploads'; // Use absolute path like doctor-service
  const adsPath = join(uploadsPath, 'ads');
  if (!existsSync(adsPath)) {
    mkdirSync(adsPath, { recursive: true });
    console.log(`📁 Created uploads directory: ${adsPath}`);
  }
  
  // Serve static files from /app/uploads (like doctor-service)
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
  
  // CORS
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });
  
  // Global prefix
  app.setGlobalPrefix('api/v1');
  
  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  const port = process.env.PORT || 3007;
  await app.listen(port);
  console.log(`🚀 Ads Service is running on: http://localhost:${port}/api/v1`);
}

bootstrap();

