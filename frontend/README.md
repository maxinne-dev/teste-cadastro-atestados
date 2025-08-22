# Frontend (Vue 3 + PrimeVue)

A modern, sober, GUI-only frontend for Atestados. This phase focuses on building and validating the entire UI without any backend integration.

## Overview
- Tech: Vue 3, Vue Router, Pinia, PrimeVue (Aura), Vitest.
- Scope: GUI only — no API calls. All data uses local mocks with Pinia stores.
- Theme: Token-based (light/dark) bridged to PrimeVue.
- A11y/UX: WCAG-AA baseline, responsive layout, empty/loading states, validation.

## Quick Start
- Install: `cd frontend && npm ci`
- Dev server: `npm run dev`
- Typecheck: `npm run typecheck` (lint is deferred in this phase)
- Tests: `npm run test` (or `npm run test:cov`)
- Build: `npm run build`; Preview: `npm run preview`

## No-API Scope (Important)
- Never call the backend or rely on network in this phase.
- All screens, modals, and forms must function with in-memory data.
- Integration points are documented below for a future phase.

## Mock Data and Stores
- Mocks live in `src/mocks/data.ts`.
- Pinia stores (`src/stores/*`) operate against the mocks and simulate latency with `setTimeout`.
- Common stores:
  - `auth`: dummy token in `localStorage` for guards.
  - `collaborators`: list + create/update + toggle status.
  - `certificates`: list + create + cancel.

## Theme and Global Styles
- Tokens: `src/styles/tokens.css` (colors, spacing, typography, radii, shadows, focus).
- Bridge: `src/styles/theme-bridge.css` maps tokens to PrimeVue theme variables.
- Global: `src/styles/global.css` includes reset, containers, utilities, skip-link, and reduced-motion.
- Dark mode: toggled by setting `[data-theme="dark"]` on `<html>`; persisted in `localStorage: theme`.

## Accessibility and Responsiveness
- Skip link at the top of the app (`#content`).
- Focus styles via `:focus-visible`; dialogs/drawers trap focus and have ARIA roles/labels.
- `DataTable` adds `aria-sort` and keyboard sort on sortable headers.
- Mobile: Sidebar overlays below `1024px`; DataTable can collapse to cards via `#card` slot.

## Reusable Components (selected)
- Base inputs: `BaseInput`, `BasePassword`, `BaseSelect`, `BaseDate`, `BaseTextarea` + `FormField` wrapper.
- Overlays: `Modal`, `SidePanel`, `ConfirmDialog` with focus trapping and ARIA.
- Display: `PageHeader`, `StatCard`, `EmptyState`, `Banner`, `SkeletonLoader`.
- Tables: `DataTable` wrapper
  - Props: `rows`, `page`, `rowsPerPage`, `sortBy`, `sortDir`, `ariaLabel`, `cardBreakpoint`.
  - Slots: `#columns`, `#row`, optional `#card` to enable card rendering below `cardBreakpoint`.
  - A11y: put `data-sort="field"` on `<th>` to enable sort; component manages `aria-sort`, tabindex, and visible sort icon.

## Routing
- Routes: `/login`, `/` (Dashboard), `/collaborators`, `/certificates`, `/certificates/new`, `/:pathMatch(.*)*` (404).
- Guard: checks a dummy `token` in `localStorage`.

## Validation
- Client-only. Examples:
  - Login: email format + required password; submit disabled until valid.
  - New Certificate: collaborator, start/end dates (start ≤ end), positive days.
  - Collaborators: required fields + 11-digit CPF (formatted via `v-mask` on input).

## Testing
- Runner: Vitest with Vue Test Utils; config in `vitest.config.ts`.
- Commands:
  - `npm run test` — run tests once
  - `npm run test:watch` — watch mode
  - `npm run test:cov` — coverage
- Notable tests:
  - App shell, routing, theme toggle persistence
  - A11y basics (skip link, roles), overlay focus trapping
  - DataTable sorting `aria-sort` and icons
  - Responsive behavior (sidebar overlay vs collapse; table → cards)
  - Form validations and mock data updates

## Extending & Theming
- Update tokens in `tokens.css`; they propagate through PrimeVue via `theme-bridge.css`.
- Add component-level styles with token variables for consistent spacing/typography.
- To add fields/flows, prefer extending Base components and `FormField`.
- DataTable: supply `#card` slot for mobile card rendering; add `data-sort` to headers for sorting.

## Where to Hook Real Services Later
- Replace mock calls in `src/stores/*` with service modules (e.g., `src/services/*.ts`).
- Keep the Pinia APIs stable so pages/components remain unchanged.
- Centralize HTTP client and interceptors in `src/services/http.ts` (to be created in integration phase).

## Folder Highlights
- `src/layouts/AppLayout.vue` — shell: topbar, sidebar, breadcrumbs, content.
- `src/components` — reusable UI blocks; `components/base` has form primitives.
- `src/pages` — page components for core flows.
- `src/utils` — formatters + date helpers; `src/directives/mask.ts` for input masks.

## Notes
- ESLint is deferred in this phase to speed up scaffolding; re-enable later with `npm run lint` and fix findings.
- PrimeVue `Drawer` is used for mobile overlay (migrated from deprecated `Sidebar`).
