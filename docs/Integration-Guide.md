# Integration Guide (Skeleton)

Scope: Replace local mocks with real backend services while preserving the current UI, routes, and component contracts. This document outlines a staged approach and the code touch points.

## 0) Preconditions
- Backend OpenAPI available and stable (see `/openapi.yaml`).
- Environment variables for base URL and auth configured (see .env.example).
- Agreement on auth flow (token/JWT/cookies) and required roles.

## 1) Project Setup
- Env: add `VITE_API_BASE_URL`, `VITE_AUTH_*` keys.
- HTTP client: create `src/services/http.ts`
  - Exports a configured Axios instance (baseURL, timeouts).
  - Interceptors: attach auth token; map errors to a normalized shape.
  - TODO: Retry/backoff policy (idempotent GETs only).

## 2) Auth & Session
- Service: `src/services/auth.ts`
  - login(email, password) → token + claims
  - logout() → clear session
  - me() → user summary and roles (optional)
- Store: `src/stores/auth.ts`
  - Replace dummy token with real login/logout actions.
  - Persist token securely (localStorage for now; revisit). 
  - TODO: Refresh flow if backend supports it.
- Router guards: strengthen to check roles via `route.meta.roles` when available.

## 3) Service Modules
- `src/services/collaborators.ts`
  - list(params) → GET /collaborators
  - get(id) → GET /collaborators/{id}
  - create(payload) → POST /collaborators
  - update(id, payload) → PUT/PATCH
  - toggleStatus(id) → action endpoint or PUT
- `src/services/certificates.ts`
  - list(params) → GET /certificates
  - get(id) → GET /certificates/{id}
  - create(payload) → POST /certificates
  - cancel(id) → POST/PUT /certificates/{id}/cancel
- `src/services/icd.ts` (optional for search)
  - search(term) → GET /icd?query=...

Notes
- Types: generate from OpenAPI or handcraft DTOs in `src/types/api.ts`.
- Use small mapping helpers (DTO → ViewModel) in `src/mappers/*.ts`.

## 4) Stores Migration (Pinia)
- Collaborators store: replace mock calls with service calls, keep state/derivations.
- Certificates store: replace list/create/cancel with services.
- Error + loading: surface in state for banners/toasts (reuse existing Banner/Toast).
- Latency simulation: remove artificial `setTimeout`.

## 5) Validation & Mapping
- Client validation remains; add server-side error display.
- Map API validation errors to field-level messages (e.g., RFC 7807 or backend format).
- Date handling: ensure ISO strings and timezone expectations match (UTC vs local).

## 6) Error Handling & UX
- Normalize error object in `http.ts` (status, code, message, fields).
- Global handler: show toast for unknown errors; show Banner in forms with field mapping.
- Unauthorized (401): redirect to login and clear session.
- Forbidden (403): show friendly “not allowed” view (optional route/page).

## 7) Configuration
- `.env` and `.env.example` updates for API base, timeouts, feature flags.
- `vite.config.ts`: ensure `import.meta.env` exposure (`VITE_*`).

## 8) Security Considerations
- Token storage: start with localStorage; evaluate HttpOnly cookie for production.
- CSRF: if cookie-based auth, implement token strategy.
- PII: avoid logging sensitive data; scrub in interceptors.

## 9) Testing Strategy
- Unit: mock Axios (or service functions) and test stores in isolation.
- Contract: consider adding API schema tests if OpenAPI mock server is used.
- E2E (future): Cypress/Playwright after backend is available.

## 10) Rollout Plan
- Phase 1: Gate real API behind feature flag `VITE_USE_API=true`; default to mocks.
- Phase 2: Turn on API for dev/stage; keep fallback to mocks.
- Phase 3: Remove mock fallback after stabilization.

## 11) TODO Checklist
- [ ] Add `http.ts` with interceptors and error normalization
- [ ] Implement `auth.ts` and replace dummy auth store
- [ ] Implement `collaborators.ts`, `certificates.ts`, optional `icd.ts`
- [ ] Update Pinia stores to use services (keep method signatures)
- [ ] Introduce DTO types and simple mappers
- [ ] Add env keys to `.env.example` and README
- [ ] Strengthen router guards with roles
- [ ] Add unit tests for services and updated stores
- [ ] Smoke-test flows on dev backend (login, lists, create/cancel)

## 12) References
- OpenAPI: `/openapi.yaml`
- Current mocks and stores: `src/mocks/`, `src/stores/`
- UI components: `src/components/`, `src/pages/`
