import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security middleware
  app.use(helmet());
  
  // CORS configuration - Allow all origins in production for mobile app access
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? true : (process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']),
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Global prefix
  app.setGlobalPrefix('api/v1');
  
  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`Doctor service is running on port ${port}`);
}
bootstrap();
