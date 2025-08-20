# Backend Wrap-up Tasks

This checklist consolidates what’s left to ship a production-ready NestJS backend that meets MAIN.md and SPECS.md. It assumes the data layer implemented in the previous session and focuses on API surface, auth, ICD integration, security, tests, and docs (including OpenAPI YAML).

## Decisions
- Sessions: strict 4h JWT; optional Redis blacklist for logout/force-expire.
- OpenAPI: generate `openapi.yaml` at the repo root.
- Pagination: use `limit/offset` for list endpoints.

## API Surface (Routes, DTOs, Controllers)
1. [x] Fix route prefixes: use global prefix `api` only; change `IcdController` path from `api/icd` to `icd` to avoid `/api/api/*`.
2. [x] `CollaboratorsController`: CRUD-lite + search
      - [x] POST `/collaborators` (create)
      - [x] GET `/collaborators/:cpf` (get by CPF)
      - [x] GET `/collaborators` (search by name, pagination with `limit/offset`)
      - [x] PATCH `/collaborators/:cpf/status` (activate/deactivate)
      - [x] Tests + validation: controller unit tests added (e2e pending Supertest)
      - [x] run `npm test` and `npm run build`. Fix any error that may appear.
3. [x] `UsersController`: minimal user management
      - [x] POST `/users` (admin-create user)
      - [x] GET `/users/:email` (get)
      - [x] PATCH `/users/:email/status` (enable/disable)
      - [x] PATCH `/users/:email/roles` (assign roles)
      - [x] Tests + validation: controller unit tests added (role protection/e2e pending auth)
      - [x] run `npm test` and `npm run build`. Fix any error that may appear.
4. [x] `MedicalCertificatesController`: register, query and cancel
    - [x] POST `/medical-certificates` (create; denormalized ICD fields required)
    - [x] GET `/medical-certificates` (filter by collaborator, range, status, icdCode; pagination with `limit/offset` + sorting by date)
    - [x] PATCH `/medical-certificates/:id/cancel` (cancel)
    - [x] Tests + validation: controller unit tests added (e2e pending Supertest)
    - [x] run `npm test` and `npm run build`. Fix any error that may appear.
5. [ ] DTOs with validation (class-validator)
    - [ ] Create Collaborator DTO: `fullName`, `cpf` (normalize + CPF validator), `birthDate`, `position`, optional `department`
    - [ ] Update Status DTOs with enum checks
    - [ ] Create User DTO: `email` (lowercase), `fullName`, `password` (min length), optional `roles: string[]`
    - [ ] Assign Roles DTO: deduplicate roles
    - [ ] Create MedicalCertificate DTO: `collaboratorId`, `startDate`, `endDate` (end >= start), `days` (1..365), `icdCode`, `icdTitle`, optional `diagnosis`, optional `issuerUserId`
    - [ ] Pagination DTO: `limit`, `offset` with sane defaults and bounds
    - [ ] Tests + validation: DTO validation unit tests incl. edge cases
    - [ ] run `npm test` and `npm run build`. Fix any error that may appear.
6. [ ] Error handling & responses
    - [ ] Map Mongo duplicate key to `409 Conflict` with clear message (cpf/email/code)
    - [ ] Return 400 on validation errors and 404 for not-found
    - [ ] Standardize list responses: `{ results, limit, offset, total }`
    - [ ] Tests + validation: error mapping/unit tests and e2e for typical failure cases
    - [ ] run `npm test` and `npm run build`. Fix any error that may appear.

## Authentication & Authorization
1. [ ] Passwords: store BCrypt hashes, not plaintext (replace current seed `passwordHash` with hashing on create)
    - [ ] Tests + validation: hashing and compare flows;
    - [ ] run `npm test` and `npm run build`. Fix any error that may appear.
2. [ ] JWT auth (4h session) + Redis session record
    - [ ] Login endpoint: POST `/auth/login` returns access token; invalidate old sessions (Redis blacklist optional)
    - [ ] Logout endpoint: POST `/auth/logout` (blacklist/expire session key in Redis)
    - [ ] Refresh/extend session strategy (optional; or re-login after 4h)
    - [ ] Guard: `JwtAuthGuard` to protect private routes
    - [ ] Roles: `RolesGuard` + `@Roles()` decorator for RBAC (e.g., `admin`, `hr`)
    - [ ] Tests + validation: e2e login/logout, guard/roles behavior (401/403);
    - [ ] run `npm test` and `npm run build`. Fix any error that may appear.
3. [ ] Protect routes
    - [ ] Public: `/health`, `/icd/search`, `/auth/login`
    - [ ] Authenticated: collaborators, users, certificates
    - [ ] Admin-only: user management
    - [ ] Tests + validation: route protection e2e
    - [ ] run `npm test` and `npm run build`. Fix any error that may appear.

## ICD Integration (WHO API)
1. [ ] Fix `IcdController` base path as above
2. [ ] Token lifecycle: keep current in-memory cache; add clock-skew safety and error paths
3. [ ] Result caching: on successful search, upsert codes to `icdcodes` via `IcdCacheService`
4. [ ] Fallback: when WHO API fails, attempt to suggest from local `icdcodes` by code/title regex
5. [ ] Rate limiting/circuit breaker for `/icd/search` to avoid abuse and spiky load
6. [ ] Config: respect `WHO_ICD_BASE_URL` and optional release parameter; timeouts + retries with backoff
    - [ ] Tests + validation: WHO happy path (mocked), fallback to cache, rate limiting
    - [ ] run `npm test` and `npm run build`. Fix any error that may appear.

## Audit & Compliance
1. [ ] Request audit middleware/interceptor
    - [ ] Log accesses that include CPF, collaboratorId, or certificate mutations
    - [ ] Include `actorUserId`, `resource`, `targetId`, `ip`, `userAgent`
2. [ ] Domain audit events on critical actions
    - [ ] User status/role change, collaborator status change
    - [ ] Certificate create/cancel
3. [ ] TTL control: honor `AUDIT_TTL_DAYS` from env (already supported by schema factory)
4. [ ] PII minimization: avoid logging full tokens/secrets; partial hashing for identifiers if needed
    - [ ] Tests + validation: middleware unit/e2e and audit event recording
    - [ ] run `npm test` and `npm run build`. Fix any error that may appear.

## Non-Functional Hardening
1. [ ] Security middleware: `helmet`, rate limiter for auth and ICD, `compression`
2. [ ] Config validation: `@nestjs/config` schema to validate required env vars (JWT, Mongo, Redis, WHO credentials)
3. [ ] CORS: confirm prod origins; narrow from `origin: true` if possible
4. [ ] API versioning: optionally enable URI or header versioning (e.g., `v1`)
5. [ ] Logging: structured logs (requestId), error filter for Axios/Mongoose
    - [ ] Tests + validation: basic middleware/bootstrapping smoke tests
    - [ ] run `npm test` and `npm run build`. Fix any error that may appear.

## Testing (Target ≥80% on new code)
1. [ ] Unit tests
    - [ ] Controllers (HTTP mapping, validation errors)
    - [ ] Auth services (hashing, JWT, guards, roles)
    - [ ] ICD service fallbacks and cache integration
    - [ ] Audit middleware/interceptor
2. [ ] Integration tests (Supertest)
    - [ ] `/health` returns ok
    - [ ] `/auth/login` and protected route flow (401/403 cases)
    - [ ] Collaborators create/find/search/status with Mongo memory server or test DB
    - [ ] Certificates create/filter/cancel; date range and status filters
    - [ ] ICD `/icd/search` happy path (mock WHO) and fallback to cache
3. [ ] Coverage: add `test:cov` to CI; ensure excludes for `main.ts`
    - [ ] Validation: run `npm test` and `npm run build` on CI to fail fast.

## Seed & Data
1. [ ] Seed users with hashed password and meaningful roles (admin/hr)
2. [ ] Option to disable WHO calls during seed; seed a few ICD codes in cache
3. [ ] Document seed usage in README and ensure idempotency (already scaffolded)
    - [ ] Validation: run `npm test` and `npm run build` after seed-related changes.

## DevOps & DX
1. [ ] Add `@nestjs/swagger` and generate OpenAPI YAML
    - [ ] Annotate DTOs and controllers
    - [ ] Swagger setup (dev only) and script to emit `openapi.yaml` at repo root
    - [ ] Add `npm run openapi:yaml` in backend to generate spec deterministically
    - [ ] Security Schemes: Bearer JWT only, applied to protected routes
    - [ ] Tests + validation: basic swagger boot + spec generation
    - [ ] run `npm test` and `npm run build`. Fix any error that may appear.
2. [ ] Docker
    - [ ] Confirm healthcheck and prod `start` uses compiled `dist`
    - [ ] Ensure Redis/Mongo envs align with docker-compose
    - [ ] Validation: local build and container start
    - [ ] run `npm run build` before image build.
3. [ ] CI
    - [ ] Lint, typecheck (TS), unit+integration tests, and build
    - [ ] Optional: publish OpenAPI artifact as CI artifact
    - [ ] Validation: ensure CI runs `npm test` and `npm run build` gates.

## Documentation
1. [ ] Update root `README.md` and add `backend/README.md`
    - [ ] Setup (env vars, WHO credentials), run, test, seed, Docker notes
    - [ ] Auth flow, roles, and protected routes
    - [ ] ICD integration behavior (cache, fallback, rate limiting)
2. [ ] Add `docs/` with API usage snippets and error codes
3. [ ] Provide `openapi.yaml` at repo root and link it from README

---

## Notes / Follow-ups
- ICD search: acceptable fallback already defined (local cache regex matches) — confirm UX expectations on empty/partial results.
