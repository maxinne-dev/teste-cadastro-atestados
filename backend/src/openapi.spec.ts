// Mock NestFactory to avoid real module bootstrap and DB connections
jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(async () => ({
      setGlobalPrefix() {},
      useGlobalPipes() {},
      useGlobalFilters() {},
      enableVersioning() {},
      close: async () => {},
    })),
  },
}));

import { buildOpenApiDocument } from './openapi';

describe('OpenAPI generation', () => {
  it('builds a document with bearer scheme', async () => {
    const doc = await buildOpenApiDocument();
    expect(doc.openapi).toMatch(/^3\./);
    expect(doc.components?.securitySchemes?.bearer).toBeDefined();
  });
});
