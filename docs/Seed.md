# Seed & Sample Data

The backend ships with an idempotent seed that creates sample users, collaborators, ICD codes, and certificates.

## Commands

```bash
cd backend
npm run seed

# Skip local ICD cache population during seed
SEED_DISABLE_ICD=true npm run seed
```

## What it does
- Users: creates `admin@example.com` (admin) and `hr@example.com` (hr)
- Passwords: if a `passwordHash` in `mock-data.ts` is not a bcrypt hash, it is hashed at runtime
- Collaborators: inserts unique CPFs and basic profile fields
- ICD: upserts a few codes into `icdcodes` collection (unless `SEED_DISABLE_ICD=true`)
- Certificates: creates a small set linked to collaborators

All operations are idempotent and keyed by unique fields and `metadata.seedKey`.

## Configuration
- Uses `MONGODB_URI` (defaults to `mongodb://localhost:27017/atestados` outside Docker)
- Does not call WHO API — only populates local cache

## Files
- `backend/src/seeds/mock-data.ts`: data blueprints
- `backend/src/seeds/seed.ts`: seed logic (idempotent)
- `backend/src/seeds/cli.ts`: CLI entry

