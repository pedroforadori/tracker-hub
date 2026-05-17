import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const isProd = process.env.NODE_ENV === 'production';
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') ??
    (isProd ? [] : ['http://localhost:5173', 'http://localhost:3000']);

  if (isProd && !process.env.CORS_ORIGINS) {
    console.warn('[Security] CORS_ORIGINS não definida em produção — todas as origens cross-origin bloqueadas');
  }

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Tracker Hub API')
      .setDescription('API REST do MicroSaaS de rastreamento veicular — multi-tenant')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3333);
}

bootstrap();
