# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: NestJS API (TypeScript). Entry `src/main.ts`, modules under `src/**` (e.g., `icd/`, `health.controller.ts`). Build output in `dist/`.
- `frontend/`: Vue 3 + Vite app. Entry `src/main.ts`, views/components in `src/*.vue`.
- Root: `docker-compose.yml`, `.env(.example)`, `README.md`, `SPECS.md`, `MAIN.md`.
- Data: MongoDB volume `mongo_data` is managed by Docker; no repo data files.

## Build, Test, and Development Commands
- Root (Docker): `docker compose up -d --build` — builds and starts API, Web, MongoDB, Redis. `docker compose down` — stops. Logs: `docker compose logs -f api|web`.
- Backend: `cd backend`
  - `npm run start:dev` — Nest dev server with watch.
  - `npm run build` — compile to `dist/` and `npm start` to run.
  - `npm run lint` / `npm run format` — ESLint / Prettier for `src/**/*.ts`.
- Frontend: `cd frontend`
  - `npm run dev` — Vite dev server (proxy `/api` to API).
  - `npm run build` — production build. `npm run preview` — preview build.
  - `npm run lint` / `npm run typecheck` — ESLint / vue-tsc.

## Coding Style & Naming Conventions
- TypeScript, 2-space indentation, Prettier formatting; keep imports using explicit file extensions when required by ESM.
- NestJS: name by responsibility (e.g., `*.module.ts`, `*.controller.ts`, `*.service.ts`).
- Vue: component files `PascalCase.vue` (e.g., `NewCertificate.vue`); TS/utility files `kebab-case.ts`.
- Keep functions small; validate DTOs with `class-validator`; enable `ValidationPipe` already configured in `main.ts`.

## Testing Guidelines
- No test runner is configured yet. When adding tests:
  - Backend: Jest + `@nestjs/testing` + Supertest; colocate as `src/**/name.spec.ts`.
  - Frontend: Vitest + Vue Test Utils; colocate as `src/**/Name.spec.ts`.
- Target ≥80% coverage on new code. Add basic health and ICD integration tests first.

## Commit & Pull Request Guidelines
- Use Conventional Commits (e.g., `feat: ...`, `fix: ...`, `chore: ...`). Keep scope focused and messages imperative.
- PRs: include purpose, scope, linked issue, setup notes, and screenshots for UI changes. Ensure: build passes, `lint`/`typecheck` clean, updated docs if env/config changes.

## Security & Configuration Tips
- Never commit secrets. Copy `.env.example` to `.env` and set `JWT_SECRET`, `WHO_ICD_CLIENT_ID/SECRET`, `MONGODB_URI`, `VITE_API_BASE_URL`.
- Local dev URLs: API `http://localhost:3000/health`; Web `http://localhost:5173`. CORS is enabled in the API.
