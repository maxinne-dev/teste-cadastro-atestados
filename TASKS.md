# Project Tasks — Full Integration Plan

This task list consolidates MAIN.md, SPECS.md, and project READMEs into an actionable plan to fully integrate the Vue 3 frontend with the NestJS backend, including WHO ICD API, authentication, persistence, tests, and Dockerized dev/prod flows.

## Environment & Bootstrap
1. Repo and tooling
   - [x] Confirm Node.js 20+, Docker 24+, Compose, and Git installed
   - [x] Copy `.env.example` to `.env` and set all variables (API, Web, Mongo, Redis, WHO ICD)
   - [x] Validate CORS origins and `VITE_API_BASE_URL`/proxy settings for local/dev
   - [x] Verify ESLint/Prettier configs run clean on both apps
2. Containers and services
   - [x] Run `docker compose up -d --build` and ensure API, web, MongoDB, and Redis are healthy
   - [x] Confirm API health: `http://localhost:3000/health`
   - [x] Confirm frontend dev/preview renders and proxies `/api` correctly
3. Seed and base data
   - [x] Seed sample data from backend (`npm run seed`) against dev MongoDB
   - [x] Verify created users (`admin@example.com`, `hr@example.com`) and baseline collections

## Security, Auth & Sessions (Backend)
1. JWT + sessions
   - [ ] Implement login: `POST /api/auth/login` returning JWT with 4h expiry
   - [ ] Store session metadata in Redis (`session:<jti>`) with 4h TTL
   - [ ] Implement logout: `POST /api/auth/logout` invalidating token/session
   - [ ] Add guards: `JwtAuthGuard`, `@Public()` for health, login, ICD search
2. RBAC
   - [ ] Implement roles and `@Roles('admin'|'hr')` guard
   - [ ] Protect admin-only endpoints (e.g., users)
3. Rate limiting & security headers
   - [ ] Apply rate limit for auth (`AUTH_RATE_LIMIT_RPM`) and ICD endpoint (`ICD_RATE_LIMIT_RPM`)
   - [ ] Configure secure headers (CORS, no sniff, frameguard) and request validation pipeline

## WHO ICD Integration (Backend)
1. OAuth2 Client Credentials
   - [ ] Configure token endpoint `https://icdaccessmanagement.who.int/connect/token`
   - [ ] Implement token acquisition with client id/secret; reuse until near-expiry
   - [ ] Handle 401 by refreshing token once and retrying
2. Search endpoint
   - [ ] Create `GET /api/icd/search?q=term` with query validation and rate limit
   - [ ] Call WHO API with required headers (`Authorization`, `API-Version: v2`, `Accept-Language`)
   - [ ] Map WHO responses to `{ code, title/description }` flat structure
3. Caching & fallback
   - [ ] Cache token in memory and/or Redis with expiry
   - [ ] Upsert successful results into `icdcodes` collection
   - [ ] Implement fallback: on WHO API failure, query `icdcodes` by code/title
   - [ ] Log upstream errors with structured context

## Data Model & Persistence (Backend)
1. Collections and schemas
   - [ ] `users` with email(unique), password hash, roles, status
   - [ ] `collaborators` with fullName, cpf(unique), birthDate, position, status
   - [ ] `icdcodes` with code(unique), title/description, metadata
   - [ ] `medicalcertificates` with collaboratorId, issueDate, startDate, endDate, days, icdCode/icdTitle, notes, status
   - [ ] `auditlogs` with actor, action, resource, targetId, timestamp (TTL optional)
2. Indexes
   - [ ] Ensure unique and compound indexes as referenced in README (cpf, email, icdcodes.code, medicalcertificates composite)
   - [ ] Add text/indexes needed for search and typical queries
3. Validation
   - [ ] Validate CPF (Brazil) on DTOs
   - [ ] Enforce date ranges and required fields on certificate creation

## Business Endpoints (Backend)
1. Health & meta
   - [ ] `/api/health` reports Mongo, Redis, and WHO API status
2. Auth
   - [ ] `POST /api/auth/login`, `POST /api/auth/logout`
3. Collaborators
   - [ ] `GET /api/collaborators` with search/filter/pagination/sort
   - [ ] `POST /api/collaborators` create with validation (CPF, required fields)
   - [ ] `PATCH /api/collaborators/:id` update fields and status (active/inactive)
   - [ ] Conflict handling (11000) → 409 with structured error payload
4. Medical Certificates
   - [ ] `GET /api/medical-certificates` with filters (collaborator, period, CID), pagination, sort
   - [ ] `POST /api/medical-certificates` create; denormalize `icdCode/icdTitle`
   - [ ] `PATCH /api/medical-certificates/:id` to cancel/update status
5. ICD Search
   - [ ] `GET /api/icd/search?q=term` (public, rate limited, fallback to cache)

## Frontend Integration (Vue 3)
1. HTTP client & auth plumbing
   - [ ] Create `src/services/http.ts` with base URL (`/api` via proxy or `VITE_API_BASE_URL`)
   - [ ] Add interceptors to attach Bearer token, handle 401 (logout/redirect), and unify errors
   - [ ] Persist token in `localStorage`; expose helper for auth header
2. Replace mocks with real services
   - [ ] Implement `src/services/auth.ts` → login/logout using API
   - [ ] Implement `src/services/collaborators.ts` → list/create/update/toggle
   - [ ] Implement `src/services/certificates.ts` → list/create/cancel
   - [ ] Implement `src/services/icd.ts` → search with debounce/autocomplete
   - [ ] Remove/disable mock latency and data once API is wired
3. Stores migration (Pinia)
   - [ ] Update `auth` store to call `auth` service and manage token/session expiry
   - [ ] Update `collaborators` store to use API; align filters/pagination with backend query params
   - [ ] Update `certificates` store to use API; ensure sorting and pagination map correctly
4. Routing guards & UX
   - [ ] Route guard uses token presence and (optionally) role checks
   - [ ] Protect dashboard/collaborators/certificates routes; keep `/login` public
5. UI flows
   - [ ] Login: validate form, call API, store token, redirect
   - [ ] Collaborators: list (filters, paging, sort), create/edit, toggle status
   - [ ] Certificates: list (filters: collaborator, period, CID; paging; sort)
   - [ ] New Certificate: select collaborator, dates/days, ICD autocomplete via API, optional notes, submit
   - [ ] ICD Autocomplete: debounce, loading states, empty/error states, selection shows `code - title`

## UX, Validation & Accessibility
1. Forms and validation
   - [ ] Client-side validation mirrors backend DTOs (CPF, dates, required fields)
   - [ ] Show inline errors and disable submit when invalid
2. Feedback & states
   - [ ] Loading skeletons and progress indicators on list/fetch
   - [ ] Toasts/banners for success, warnings, and error cases (401/403/409/422)
   - [ ] Show ICD integration status and fallback indicator when WHO API is down
3. Responsiveness & a11y
   - [ ] Ensure pages are responsive (DataTable → cards on small screens)
   - [ ] Maintain skip link, focus trapping in dialogs, ARIA roles/labels

## Testing (Backend & Frontend)
1. Backend unit/integration (Jest + Supertest)
   - [ ] Health endpoint tests (Mongo/Redis/WHO checks stubbed)
   - [ ] Auth: login/logout, JWT expiry, guards, RBAC
   - [ ] Collaborators: create/list/update with filters, 409 on duplicate CPF
   - [ ] ICD search: token handling, success/fallback, rate limit behavior (mock WHO)
   - [ ] Certificates: create/list/cancel with filters/pagination/sorting
   - [ ] Index and schema constraints (duplicate keys, invalid ObjectId)
2. Frontend unit (Vitest + Vue Test Utils)
   - [ ] Auth store/service: login flow, 401 handling, token persistence
   - [ ] Collaborators list: filters, pagination, sorting interactions
   - [ ] Certificates list & creation: validations and API calls
   - [ ] ICD autocomplete: debounce and rendering results
   - [ ] Accessibility basics: skip link, focus states, `aria-sort`
3. E2E smoke (optional, if time)
   - [ ] Happy path: login → create collaborator → create certificate with ICD → list appears
   - [ ] Error path: duplicate CPF → 409 surfaced in UI

## Observability & Error Handling
1. Structured logging
   - [ ] Add structured logs for auth, ICD calls, CRUD operations, and errors
   - [ ] Correlate requests where possible; include WHO upstream error codes
2. Healthchecks & readiness
   - [ ] Health endpoint aggregates Mongo, Redis, WHO ICD status
   - [ ] Docker healthchecks for API container
3. Error mapping
   - [ ] Backend exception filters for Mongo 11000, validation errors, upstream (map to 4xx/5xx)
   - [ ] Frontend maps API errors to user-friendly messages and actions

## DevOps & Delivery
1. Docker & compose
   - [ ] Confirm `docker-compose.yml` builds API/Web with proper env wiring
   - [ ] Ensure `/api` proxy in frontend (dev/prod) targets correct host/container
2. CI basics (optional now, recommended)
   - [ ] Lint, typecheck, test, and build steps for backend and frontend
   - [ ] Publish `openapi.yaml` artifact from backend
3. OpenAPI
   - [ ] Generate/refresh `openapi.yaml` (`npm run openapi:yaml` in backend)
   - [ ] (Optional) Generate frontend API types from OpenAPI and refactor services to use them

## Documentation & Handover
1. Environment & credentials
   - [ ] Document how to obtain WHO credentials and configure `.env`
   - [ ] Note rate limits, language/release parameters (`WHO_ICD_RELEASE`, `WHO_ICD_LANGUAGE`)
2. Running locally
   - [ ] Update root `README.md` with exact run/seed instructions and troubleshooting
   - [ ] Add usage examples for all API endpoints
3. User flows
   - [ ] Add short guide with screenshots for: login, collaborators, certificates, ICD search

## Acceptance Checklist (End-to-End)
1. Core features
   - [ ] Login works; protected routes enforce auth; session expires in ~4h
   - [ ] Manage collaborators with CPF validation and status; duplicate CPF rejected
   - [ ] Create certificates with valid date ranges and ICD selection
   - [ ] List certificates with filters (collaborator, period, CID), pagination, and sort
2. ICD integration
   - [ ] WHO ICD autocomplete returns real-time results with debounce
   - [ ] On WHO outage, search falls back to local cache with clear UI indicator
3. Quality gates
   - [ ] Backend tests pass (including ICD stubs); coverage ≥ 80% on new code
   - [ ] Frontend tests pass; coverage ≥ 80% on new code
   - [ ] Lint/typecheck clean; Docker build runs; healthcheck green
4. Docs & ops
   - [ ] OpenAPI updated; READMEs cover setup and credentials
   - [ ] Docker Compose up/down verified; logs documented
