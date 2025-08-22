jest.mock('mongoose', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockData = require('./mock-data');
  const calls = { updateOne: [], insertOne: [], find: [] as any[] };
  const collections: Record<string, any> = {};
  const makeCollection = (name: string) => {
    const state: any = {
      updateOne: jest.fn(async (...args: any[]) => {
        calls.updateOne.push([name, ...args]);
        return { acknowledged: true };
      }),
      insertOne: jest.fn(async (...args: any[]) => {
        calls.insertOne.push([name, ...args]);
        return { acknowledged: true };
      }),
      find: jest.fn((filter: any) => {
        calls.find.push([name, filter]);
        if (name === 'collaborators') {
          const docs = (mockData.mockCollaborators || []).map((c: any) => ({
            ...c,
            _id: `id:${c.cpf}`,
          }));
          return { toArray: async () => docs };
        }
        return { toArray: async () => [] };
      }),
    };
    collections[name] = state;
    return state;
  };
  const connection = {
    readyState: 1,
    collection: (name: string) => collections[name] || makeCollection(name),
  };
  const mocked: any = {
    connection,
    connect: jest.fn(async () => mocked),
    __calls: calls,
  };
  return { __esModule: true, default: mocked, ...mocked };
});

import * as mongoose from 'mongoose';
import {
  mockCollaborators,
  mockUsers,
  mockIcdCodes,
  mockCertificates,
} from './mock-data';

describe('Seed script scaffold', () => {
  it('runs idempotently, writes meta, seeds core docs and links certificate to collaborator', async () => {
    const { run } = await import('./seed');
    process.env.MONGODB_URI = 'mongodb://localhost:27017/atestados_test_seed';

    await run();
    await run(); // idempotent

    const calls = (mongoose as any).__calls;
    const metaOps = calls.updateOne.filter((c: any) => c[0] === 'meta');
    expect(metaOps.length).toBeGreaterThanOrEqual(2);

    const collabOps = calls.updateOne.filter(
      (c: any) => c[0] === 'collaborators',
    );
    expect(collabOps.length).toBeGreaterThanOrEqual(
      (mockCollaborators || []).length,
    );
    const userOps = calls.updateOne.filter((c: any) => c[0] === 'users');
    expect(userOps.length).toBeGreaterThanOrEqual((mockUsers || []).length);
    const icdOps = calls.updateOne.filter((c: any) => c[0] === 'icdcodes');
    expect(icdOps.length).toBeGreaterThanOrEqual((mockIcdCodes || []).length);

    const certOps = calls.updateOne.filter(
      (c: any) => c[0] === 'medicalcertificates',
    );
    expect(certOps.length).toBeGreaterThanOrEqual(
      (mockCertificates || []).length,
    );
    const certFilter = certOps[0]?.[1];
    expect(certFilter['metadata.seedKey']).toBeDefined();
    const certDoc = certOps[0]?.[2]?.$setOnInsert;
    expect(certDoc).toHaveProperty('collaboratorId');
  });
});
