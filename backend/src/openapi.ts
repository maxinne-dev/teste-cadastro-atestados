import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { ValidationPipe, VersioningType } from '@nestjs/common'
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter.js'
import { AxiosExceptionFilter } from './common/filters/axios-exception.filter.js'
import { RequestAuditInterceptor } from './audit/request-audit.interceptor.js'
import { JwtAuthGuard } from './auth/jwt-auth.guard.js'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

export async function buildOpenApiDocument() {
  // Create app similarly to main bootstrap but without listening
  const app = await NestFactory.create(AppModule, { logger: false })
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalFilters(new MongoExceptionFilter())
  app.useGlobalFilters(new AxiosExceptionFilter())
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })

  const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger')
  const config = new DocumentBuilder()
    .setTitle('Atestados API')
    .setDescription('API de atestados médicos')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build()

  const doc = (SwaggerModule as any).createDocument(app, config)
  await app.close()
  return doc
}

async function main() {
  const doc = await buildOpenApiDocument()
  const yaml = (await import('yaml')).stringify(doc as any)
  const outPath = resolve(process.cwd(), '..', 'openapi.yaml')
  writeFileSync(outPath, yaml, 'utf8')
  // eslint-disable-next-line no-console
  console.log(`[openapi] Wrote ${outPath}`)
}

// Run if invoked directly via ts-node
if (process.argv[1]?.includes('openapi.ts')) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[openapi] Failed:', err)
    process.exit(1)
  })
}
