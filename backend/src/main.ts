import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter.js';
import { AxiosExceptionFilter } from './common/filters/axios-exception.filter.js';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // CORS: allow specific origins if provided, else allow all in dev
  const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const isProd = process.env.NODE_ENV === 'production'
  app.enableCors({
    origin: origins.length ? origins : isProd ? false : true,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new MongoExceptionFilter());
  app.useGlobalFilters(new AxiosExceptionFilter());
  // Note: URI versioning removed to keep routes at /api/* without /v1
  // Security headers
  app.use(new SecurityHeadersMiddleware().use);

  // Swagger (dev only)
  const enableSwagger = process.env.NODE_ENV !== 'production' || process.env.SWAGGER === 'true'
  if (enableSwagger) {
    const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger')
    const config = new DocumentBuilder()
      .setTitle('Atestados API')
      .setDescription('API de atestados médicos')
      .setVersion('1.0.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
      .build()
    const doc = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, doc)
  }

  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
}
bootstrap();
