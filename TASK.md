# Data Layer Implementation Plan

Goal: Evolve the backend from the current state to a complete, testable data layer where all core data models and their relationships are defined and verified. Each task below is self-contained and includes clear, automated acceptance tests. Implement tasks sequentially; after each one: read -> implement -> test -> fix -> test -> success -> next.

Context
- Backend: NestJS + TypeScript + Mongoose (already configured in `app.module.ts`).
- ESM imports in TS (use explicit `.js` extensions in source imports).
- Tests: Jest is configured (see `backend/src/health.controller.spec.ts`). Place specs next to sources as `*.spec.ts`.
- Data privacy: Plan includes fields and hooks to support LGPD concerns; details enforced in later security tasks, but data shapes anticipate them.

Conventions
- Folders under `backend/src/` follow modular structure: `<domain>/<domain>.module.ts`, `<domain>.schema.ts`, `<domain>.service.ts` (repositories), `<domain>.types.ts`, and `*.spec.ts` co-located.
- All schemas use `{ timestamps: true }` and define useful indexes.
- Keep imports using explicit `.js` extensions to satisfy NodeNext/ESM.
- DTOs and controllers are out of scope here; write minimal service/repository APIs only when needed to test models.

Tasks:
1) Bootstrap database utilities
    - Purpose: Provide shared schema helpers and validators used across models.
    - Implement:
      - Add `backend/src/common/database/base.schema.ts`: Mongoose helpers (id virtual, toJSON without `__v`), and typed `BaseDocument`.
      - Add `backend/src/common/validators/br.ts`: CPF normalization and format validator (no external deps for now).
      - Add `backend/src/common/database/index.ts` to export helpers.
    - Tests (backend):
      - `backend/src/common/database/base.schema.spec.ts` verifies: the plugin adds `id`, hides `__v`, preserves timestamps on a dummy schema.
      - `backend/src/common/validators/br.spec.ts` verifies CPF normalization and validator for valid/invalid CPFs.
    - Success criteria:
      - All tests pass with `cd backend && npm run test`.


2) Define Collaborator model (HR entity)
    - Purpose: Persist employees as “collaborators” (distinct from application users).
    - Implement:
      - `backend/src/collaborators/collaborator.schema.ts`: fields: `fullName` (string, required, indexed), `cpf` (string, required, unique, normalized digits), `birthDate` (Date, required), `position` (string, required), `department` (string, optional), `status` (enum: `active|inactive`, default `active`, indexed). Add unique index on `cpf` and text index on `fullName`.
      - `backend/src/collaborators/collaborators.module.ts`: register schema via `MongooseModule.forFeature`.
      - `backend/src/collaborators/collaborators.service.ts`: minimal repository-style methods: `create`, `findByCpf`, `searchByName`, `setStatus`.
    - Tests (backend): `backend/src/collaborators/collaborators.spec.ts` using Nest Testing + Mongoose (real local URI from env is fine in CI/dev; alternatively, use mongodb-memory-server if preferred when implementing).
      - Creating a valid collaborator succeeds and stores normalized CPF.
      - Duplicate CPF rejects (unique index enforced).
      - `searchByName` returns expected matches; `setStatus` flips to `inactive`.
      - Index smoke check via `Model.collection.indexes()` includes unique `cpf`.
    - Success criteria:
      - Tests pass; coverage includes success and failure paths.


2a) Seed scaffolding and mock-data file
    - Purpose: Create a runnable seed scaffold early and a `mock-data` file that we will enrich as models land, so developers already have a command to populate local data.
    - Implement:
      - Add `backend/src/seeds/seed.ts`: connects to MongoDB using `MONGODB_URI`, writes a `meta` record noting the seed run, and conditionally inserts docs if arrays exist in `mock-data`.
      - Add `backend/src/seeds/mock-data.ts`: exports arrays (`mockCollaborators`, `mockUsers`, `mockIcdCodes`, `mockCertificates`) initially empty with commented examples to be filled as we progress.
      - Update `backend/package.json` with `"seed": "ts-node --esm src/seeds/seed.ts"` script.
    - Tests (backend): `backend/src/seeds/seed-scaffold.spec.ts`
      - Spawns the seed (or calls exported `run()`), asserts that a `meta` document with a recent timestamp exists in the database.
      - Verifies the script is idempotent (two consecutive runs do not throw and `meta` is updated).
    - Success criteria:
      - Seed script runs locally with `cd backend && npm run seed`; test passes and confirms idempotent meta record creation.


3) Define ICD Code cache model
    - Purpose: Persist selected ICD codes locally to support auditability and fallback.
    - Implement:
      - `backend/src/icd-cache/icd-code.schema.ts`: fields: `code` (string, required, unique), `title` (string, required), `release` (string, e.g., `2024-01`), `lastFetchedAt` (Date, default now). Index unique on `code`.
      - `backend/src/icd-cache/icd-cache.module.ts` and `icd-cache.service.ts` with `upsert(code, title, release)`, `findByCode(code)`.
    - Tests (backend): `backend/src/icd-cache/icd-cache.spec.ts`
      - `upsert` inserts new, then updates `title` on second call without duplicating documents.
      - Unique index blocks inserting duplicate `code` manually.
      - `findByCode` returns expected document.
    - Success criteria:
      - Tests pass; unique index validated.


4) Define Medical Certificate model
    - Purpose: Persist medical certificates and link to collaborators and ICD codes.
    - Implement:
      - `backend/src/medical-certificates/medical-certificate.schema.ts`: fields:
        - `collaboratorId` (ObjectId ref `Collaborator`, required, indexed)
        - `issuerUserId` (ObjectId ref `User`, optional, indexed)
        - `issueDate` (Date, required, default now, indexed)
        - `startDate` (Date, required, indexed)
        - `endDate` (Date, required, indexed, custom validator `endDate >= startDate`)
        - `days` (number, required, min 1, max 365)
        - `diagnosis` (string, optional)
        - ICD denormalization: `icdCode` (string, required), `icdTitle` (string, required)
        - Optional relation: `icdRef` (ObjectId ref `IcdCode`, optional)
        - `status` (enum `active|cancelled|expired`, default `active`, indexed)
        - `metadata` (Map/Object, optional)
        - Indexes: `{ collaboratorId: 1, status: 1 }`, `{ issueDate: -1 }`, `{ startDate: 1, endDate: 1 }`.
      - `backend/src/medical-certificates/medical-certificates.module.ts` and `.service.ts` with methods: `create`, `findByCollaborator`, `filter({collaboratorId?, range?, status?, icdCode?})`, `cancel(id)`.
    - Tests (backend): `backend/src/medical-certificates/medical-certificates.spec.ts`
      - Creating valid certificate with existing collaborator succeeds; computed and date validations enforced (rejects when `endDate < startDate` or `days` out of range).
      - Filters by collaborator, date range, status, and ICD code return expected docs.
      - Index presence check (at least the compound collaborator+status index exists).
    - Success criteria:
      - Tests pass; invalid shapes fail as expected; filters are deterministic.


5) Define User model (application accounts) + basic RBAC data
    - Purpose: Separate application users (authz) from collaborators (HR entity) and prepare for RBAC without implementing auth flows.
    - Implement:
      - `backend/src/users/user.schema.ts`: fields: `email` (string, required, unique, lowercased), `passwordHash` (string, required), `fullName` (string, required), `roles` (string[]; e.g., `['admin','hr','doctor']`, indexed), `status` (`active|disabled`, default `active`). Unique index on `email`, index on `roles`.
      - Password hashing is not implemented here; treat `passwordHash` as an opaque string for now.
      - `backend/src/users/users.module.ts` and `.service.ts` with methods: `create`, `findByEmail`, `setStatus`, `assignRoles`.
    - Optional (data-only) role registry:
      - `backend/src/rbac/role.schema.ts`: `name` (unique), `description` (string), `permissions` (string[]). Prepare for future policy checks; no runtime guard work here.
    - Tests (backend): `backend/src/users/users.spec.ts`
      - Creating with duplicate email fails; case-insensitive uniqueness confirmed (e.g., `TEST@a.com` vs `test@a.com`).
      - `assignRoles` updates roles and indexable queries by role work.
    - Success criteria:
      - Tests pass; uniqueness and role queries behave as expected.


6) Define Audit Log model (LGPD-ready)
    - Purpose: Persist audit trails for sensitive operations (access to CPF, writes to certificates, etc.).
    - Implement:
      - `backend/src/audit/audit-log.schema.ts`: fields: `action` (string, required), `actorUserId` (ObjectId ref `User`, optional), `resource` (string path), `targetId` (ObjectId/string), `ip` (string), `userAgent` (string), `timestamp` (Date, default now, indexed), `metadata` (arbitrary object). Add TTL index optional via env (e.g., `AUDIT_TTL_DAYS`)—only if set.
      - `backend/src/audit/audit.module.ts` and `.service.ts` with `record(event)`.
    - Tests (backend): `backend/src/audit/audit.spec.ts`
      - `record` persists events; index on `timestamp` exists; TTL index applied only when env is provided.
    - Success criteria:
      - Tests pass; log retrieval by time range works.


7) Wire up modules in AppModule
    - Purpose: Ensure all models are registered and injectable.
    - Implement:
      - Import `CollaboratorsModule`, `IcdCacheModule`, `MedicalCertificatesModule`, `UsersModule`, and `AuditModule` into `AppModule`.
      - Export services that may be reused across modules.
    - Tests (backend): `backend/src/app.module.models.spec.ts`
      - Spin up Nest TestingModule with `AppModule`; resolve each service token without throwing.
    - Success criteria:
      - Test passes, confirming DI wiring and model registration.


8) Basic seed script for local development
    - Purpose: Provide sample records to manually run the app and quickly verify data relations.
    - Implement:
      - `backend/src/seeds/seed.ts`: creates one admin user, a few collaborators, example ICD code, and one certificate.
      - Add npm script: `npm run seed` to execute the script (using existing `MONGODB_URI`).
    - Tests (backend): `backend/src/seeds/seed.spec.ts`
      - Execute seed in isolated test db name (e.g., env override); assert counts for each collection and that certificate links to a collaborator.
    - Success criteria:
      - Test passes; local `npm run seed` creates data without duplicates on rerun (idempotent).


9) Query performance and indexes verification
    - Purpose: Validate that declared indexes satisfy expected query patterns.
    - Implement:
      - Add `backend/src/perf/indexes.spec.ts` focused on:
        - Collaborators: unique `cpf`, text index on `fullName` exists.
        - MedicalCertificates: compound `{ collaboratorId, status }`, `issueDate`, and range index on `{ startDate, endDate }` exist.
        - Users: unique `email`, index on `roles`.
        - ICD: unique `code`.
      - For each, inspect `collection.indexes()` and assert presence.
    - Success criteria:
      - Test passes and documents expected indexes.


10) Documentation updates
    - Purpose: Keep developers aligned on the data layer.
    - Implement:
      - Update `README.md` (backend section) with: collections, relationships diagram in text, how to run tests, seed, and index expectations.
      - Add `backend/src/**/README.md` per module (optional) summarizing schema and key queries.
    - Tests:
      - N/A automated; perform a quick manual check that file paths and commands are correct. Keep this as a review task paired with PR checklist.
    - Success criteria:
      - Documentation merged; reviewer confirms accuracy.


Relationships Summary (for reference during implementation)
- Collaborator 1—N MedicalCertificate via `collaboratorId`.
- MedicalCertificate — ICD: denormalized `icdCode/icdTitle` always stored; optional `icdRef` points to a cached ICD document.
- User N—roles via embedded `roles: string[]` (future external `Role` collection optional).
- AuditLog references `actorUserId` and records operations across resources.


Execution Notes
- Use `npm run lint` and `npm run format` in `backend/` to keep style consistent.
- Keep schemas minimal and focused; avoid premature encryption in schema code—design fields and types so that a later encryption plugin can be added without breaking changes.
- Prefer service/repository methods that are just enough to exercise tests; controller routes will be added later.
