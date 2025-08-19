/*
  Seed scaffold: safe to run at any time.
  - Connects to MongoDB using MONGODB_URI (or local default)
  - Writes/updates a meta document recording the seed run
  - Optionally inserts mock domain data from ./mock-data.js if arrays are provided
*/

import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';

// Import mock arrays; keep the .js extension for NodeNext/ESM
import {
  mockCollaborators,
  mockUsers,
  mockIcdCodes,
  mockCertificates,
} from './mock-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getMongoUri(): string {
  return (
    process.env.MONGODB_URI ||
    // Default local
    'mongodb://localhost:27017/atestados'
  );
}

async function ensureMeta() {
  const col = mongoose.connection.collection('meta');
  await col.updateOne(
    { key: 'seedScaffold' },
    {
      $set: {
        key: 'seedScaffold',
        lastRunAt: new Date(),
        note: 'Initial seed scaffold executed',
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );
}

async function insertIfAny(collectionName: string, docs: any[], uniqueKey?: string) {
  if (!Array.isArray(docs) || docs.length === 0) return { inserted: 0 };
  const col = mongoose.connection.collection(collectionName);

  let inserted = 0;
  for (const doc of docs) {
    if (uniqueKey && doc[uniqueKey] != null) {
      await col.updateOne(
        { [uniqueKey]: doc[uniqueKey] },
        { $setOnInsert: { ...doc, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true }
      );
    } else {
      await col.insertOne({ ...doc, createdAt: new Date(), updatedAt: new Date() });
      inserted += 1;
    }
  }
  return { inserted };
}

export async function run() {
  const uri = getMongoUri();
  // Avoid multiple connections if run from tests
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, { dbName: undefined });
  }

  await ensureMeta();

  // Optionally seed domain data if mock arrays are provided.
  await insertIfAny('collaborators', mockCollaborators, 'cpf');
  await insertIfAny('users', mockUsers, 'email');
  await insertIfAny('icdcodes', mockIcdCodes, 'code');
  await insertIfAny('medicalcertificates', mockCertificates);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run()
    .then(async () => {
      // eslint-disable-next-line no-console
      console.log('[seed] Completed successfully');
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      // eslint-disable-next-line no-console
      console.error('[seed] Failed:', err);
      try { await mongoose.disconnect(); } catch {}
      process.exit(1);
    });
}

