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
5. [x] DTOs with validation (class-validator)
    - [x] Create Collaborator DTO: `fullName`, `cpf` (normalize + CPF validator), `birthDate`, `position`, optional `department`
    - [x] Update Status DTOs with enum checks
    - [x] Create User DTO: `email` (lowercase), `fullName`, `password` (min length), optional `roles: string[]`
    - [x] Assign Roles DTO: deduplicate roles (transform)
    - [x] Create MedicalCertificate DTO: `collaboratorId`, `startDate`, `endDate` (end >= start), `days` (1..365), `icdCode`, `icdTitle`, optional `diagnosis`, optional `issuerUserId`
    - [x] Pagination DTO: `limit`, `offset` with sane defaults and bounds
    - [x] Tests + validation: DTO validation unit tests incl. edge cases
    - [x] run `npm test` and `npm run build`. Fix any error that may appear.
6. [x] Error handling & responses
    - [x] Map Mongo duplicate key to `409 Conflict` with clear message (cpf/email/code)
    - [x] Return 400 on validation errors and 404 for not-found
    - [x] Standardize list responses: `{ results, limit, offset, total }`
    - [x] Tests + validation: unit tests for filter and list responses (e2e pending)
    - [x] run `npm test` and `npm run build`. Fix any error that may appear.

## Authentication & Authorization
1. [x] Passwords: store BCrypt hashes, not plaintext (replace current seed `passwordHash` with hashing on create)
    - [x] Tests + validation: hashing and compare flows;
    - [x] run `npm test` and `npm run build`. Fix any error that may appear.
2. [x] JWT auth (4h session) + Redis session record
    - [x] Login endpoint: POST `/auth/login` returns access token; invalidate old sessions (session keys in Redis/in-memory for tests)
    - [x] Logout endpoint: POST `/auth/logout` (deletes session key)
    - [x] Refresh/extend session strategy (optional; or re-login after 4h)
    - [x] Guard: `JwtAuthGuard` to protect private routes
    - [x] Roles: `RolesGuard` + `@Roles()` decorator for RBAC (guard supports roles)
    - [x] Tests + validation: unit tests for login/logout flows; guard ready (role checks exercised via decorator support)
    - [x] run `npm test` and `npm run build`. Fix any error that may appear.
3. [x] Protect routes
    - [x] Public: `/health`, `/icd/search`, `/auth/login` (via `@Public` decorator)
    - [x] Authenticated: collaborators, users, certificates (global `JwtAuthGuard`)
    - [x] Admin-only: user management (via `@Roles('admin')`)
    - [x] Tests + validation: unit tests pass; guard integrated globally (e2e pending)
    - [x] run `npm test` and `npm run build`. Fix any error that may appear.

## ICD Integration (WHO API)
1. [x] Fix `IcdController` base path as above
2. [x] Token lifecycle: keep current in-memory cache; add clock-skew safety and error paths
3. [x] Result caching: on successful search, upsert codes to `icdcodes` via `IcdCacheService`
4. [x] Fallback: when WHO API fails, attempt to suggest from local `icdcodes` by code/title regex
5. [x] Rate limiting/circuit breaker for `/icd/search` to avoid abuse and spiky load
6. [x] Config: respect `WHO_ICD_BASE_URL` and optional release parameter; timeouts + retries with backoff
7. [x] Tests + validation: WHO happy path (mocked), fallback to cache, rate limiting
8. [x] run `npm test` and `npm run build`. Fix any error that may appear.

## Audit & Compliance
1. [x] Request audit middleware/interceptor
    - [x] Log accesses that include CPF, collaboratorId, or certificate mutations
    - [x] Include `actorUserId`, `resource`, `targetId`, `ip`, `userAgent`
2. [x] Domain audit events on critical actions
    - [x] User status/role change, collaborator status change
    - [x] Certificate create/cancel
3. [x] TTL control: honor `AUDIT_TTL_DAYS` from env (already supported by schema factory)
4. [x] PII minimization: avoid logging full tokens/secrets; partial hashing for identifiers if needed
    - [x] Tests + validation: interceptor unit test and audit event recording via controller actions
    - [x] run `npm test` and `npm run build`. Fix any error that may appear.

## Non-Functional Hardening
1. [x] Security middleware: `helmet`-style headers, rate limiter for auth and ICD
2. [x] Config validation: function-based validation for required env vars (JWT, Mongo)
3. [x] CORS: configurable via `CORS_ORIGINS` (comma-separated) and environment-aware defaults
4. [x] API versioning: enabled (URI), version-neutral by default (`v1`)
5. [x] Logging/Errors: structured audit already; added Axios error filter; Mongo filter already present
    - [x] Tests + validation: env validation tests; controller/unit tests pass
    - [x] run `npm test` and `npm run build`. Fix any error that may appear.

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
