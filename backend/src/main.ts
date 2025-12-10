import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/api/uploads/',
  });

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://bookpro-frontend.onrender.com',
      'https://bookpro.mx',
      'https://www.bookpro.mx',
    ],
    credentials: true,
  });

  // Configure helmet to allow static file serving
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
