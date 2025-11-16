import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const origins = (configService.get<string>('WS_ALLOWED_ORIGINS') || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins.includes('*') ? true : origins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = configService.get<number>('PORT', 3010);
  const host = configService.get<string>('HOST', '0.0.0.0');

  await app.listen(port, host);
  console.log(`🚀 Call Service listening on http://${host}:${port}`);
}

bootstrap();

