import 'reflect-metadata';
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter.js';
import { AxiosExceptionFilter } from './common/filters/axios-exception.filter.js';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
// NOTE: We import testing utilities lazily inside a branch to keep Jest tests
// (which mock NestFactory) working without pulling @nestjs/testing at load time.

export async function buildOpenApiDocument() {
  // Create the app. In Jest tests, use NestFactory so test mocks apply.
  // In non-test execution, try to avoid real DB connections via @nestjs/testing overrides.
  let app = null as any;
  if (process.env.JEST_WORKER_ID) {
    app = await NestFactory.create(AppModule, { logger: false });
  } else {
    try {
      const { Test } = await import('@nestjs/testing');
      const { getConnectionToken, getModelToken } = await import('@nestjs/mongoose');
      const builder = Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(getConnectionToken())
        .useValue({ model: () => ({}), close: async () => {} })
        .overrideProvider(getModelToken('Collaborator'))
        .useValue({})
        .overrideProvider(getModelToken('IcdCode'))
        .useValue({})
        .overrideProvider(getModelToken('MedicalCertificate'))
        .useValue({})
        .overrideProvider(getModelToken('User'))
        .useValue({})
        .overrideProvider(getModelToken('AuditLog'))
        .useValue({});
      const moduleRef = await builder.compile();
      app = moduleRef.createNestApplication({ logger: false });
    } catch {
      app = await NestFactory.create(AppModule, { logger: false });
    }
  }
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new MongoExceptionFilter());
  app.useGlobalFilters(new AxiosExceptionFilter());
  if (typeof (app as any).init === 'function') {
    await (app as any).init();
  }
  // Keep OpenAPI routes version-neutral (no /v1 prefix)

  const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
  const config = new DocumentBuilder()
    .setTitle('Atestados API')
    .setDescription('API de atestados médicos')
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .build();

  const doc = (SwaggerModule as any).createDocument(app, config);
  await app.close();
  return doc;
}

async function main() {
  const doc = await buildOpenApiDocument();
  const yaml = (await import('yaml')).stringify(doc as any);
  const outPath = resolve(process.cwd(), '..', 'openapi.yaml');
  writeFileSync(outPath, yaml, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`[openapi] Wrote ${outPath}`);
}

// Run if invoked directly via ts-node
if (process.argv[1]?.includes('openapi.ts')) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[openapi] Failed:', err);
    process.exit(1);
  });
}
