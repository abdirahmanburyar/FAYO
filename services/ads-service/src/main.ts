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
  const uploadsPath = process.env.UPLOADS_PATH || join(process.cwd(), 'uploads');
  const adsPath = join(uploadsPath, 'ads');
  if (!existsSync(adsPath)) {
    mkdirSync(adsPath, { recursive: true });
    console.log(`📁 Created uploads directory: ${adsPath}`);
  }
  
  // Security - configure helmet to allow static file serving
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Disable CSP for static files
  }));
  
  // Serve static files for uploaded images AFTER helmet
  // Files are saved to /app/uploads/ads in Docker
  // Serve from /app/uploads with prefix /uploads
  console.log(`📁 Serving static files from: ${uploadsPath}`);
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
  });
  
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

