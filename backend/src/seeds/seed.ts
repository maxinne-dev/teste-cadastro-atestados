/*
  Seed scaffold: safe to run at any time.
  - Connects to MongoDB using MONGODB_URI (or local default)
  - Writes/updates a meta document recording the seed run
  - Optionally inserts mock domain data from ./mock-data.js if arrays are provided
*/

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
// no need for __filename/__dirname in tests; avoid name clashes with CJS

// Import mock arrays; keep the .js extension for NodeNext/ESM
import {
  mockCollaborators,
  mockUsers,
  mockIcdCodes,
  mockCertificates,
} from './mock-data.js';

// (intentionally unused)

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
  // Hash user passwords if provided as plaintext or placeholder
  const users = Array.isArray(mockUsers) ? [...mockUsers] : []
  for (const u of users) {
    const val = u.passwordHash
    const needsHash = typeof val === 'string' && !/^\$2[aby]\$/.test(val)
    if (needsHash) {
      u.passwordHash = await bcrypt.hash(val || 'changeme', 10)
    }
  }
  await insertIfAny('users', users, 'email');
  // Optionally skip ICD cache seeding via env flag (seed never calls WHO API)
  if (String(process.env.SEED_DISABLE_ICD || '').toLowerCase() !== 'true') {
    await insertIfAny('icdcodes', mockIcdCodes, 'code');
  }
  // Link certificates to collaborators and upsert idempotently by a seedKey
  if (Array.isArray(mockCertificates) && mockCertificates.length > 0) {
    const collabCol = mongoose.connection.collection('collaborators');
    const cpfs = mockCertificates.map((c: any) => c.collaboratorCpf).filter(Boolean);
    let cpfMap: Record<string, any> = {};
    if (cpfs.length) {
      const found = await collabCol
        .find({ cpf: { $in: Array.from(new Set(cpfs)) } })
        .toArray();
      cpfMap = Object.fromEntries(found.map((d: any) => [d.cpf, d._id]));
    }
    const certCol = mongoose.connection.collection('medicalcertificates');
    for (const c of mockCertificates) {
      const doc: any = { ...c };
      if (!doc.collaboratorId && doc.collaboratorCpf) {
        const id = cpfMap[doc.collaboratorCpf];
        if (id) doc.collaboratorId = id;
        delete doc.collaboratorCpf;
      }
      doc.metadata = doc.metadata || {};
      if (!doc.metadata.seedKey) {
        const s = [doc.icdCode, doc.startDate?.toString(), doc.endDate?.toString(), String(doc.collaboratorId || '')]
          .filter(Boolean)
          .join('|');
        doc.metadata.seedKey = `seed:auto:${Buffer.from(s).toString('base64').slice(0, 16)}`;
      }
      await certCol.updateOne(
        { 'metadata.seedKey': doc.metadata.seedKey },
        { $setOnInsert: { ...doc, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true }
      );
    }
  }
}
