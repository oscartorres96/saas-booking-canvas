import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // CORS: permitir hosts locales y rangos de red para frontend en 5173
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:5173$/,
    /^http:\/\/10\.1\.1\.\d{1,3}:5173$/,
  ];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true); // permite clientes nativos/postman
      const isAllowed = allowedOrigins.some((rule) =>
        typeof rule === 'string' ? rule === origin : rule.test(origin),
      );
      return isAllowed ? callback(null, true) : callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  app.use(helmet());
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
