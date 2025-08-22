# Frontend GUI Tasks — Dummy UI Only (No API Integration)

This plan covers building a complete, modern, and sober GUI in `frontend/` using Vue 3 + PrimeVue, with navigable pages, modals, and forms backed by local mock data only. No API integration should be implemented at this stage.

Important: Do NOT call or depend on any backend API. Use local fixtures/mocks so the whole UI runs and can be validated visually and functionally (routing, navigation, validation) without a server.

Note: ESLint checks are temporarily deferred to speed up UI scaffolding. We will re-enable and fix lint findings later. For now, use typecheck + tests as the primary gates.

## Foundations and Theme

1. Design tokens and theme setup
   - [x] Define neutral color palette (primary/secondary, success/warn/error, surface, text, dark mode)
   - [x] Establish spacing scale, radius, shadows, typography (font family/size/line-height)
   - [x] Create CSS variables and PrimeVue mapping plan (spec only; no code yet)
   - [x] Configure dark mode strategy (spec only; no code yet)
   
   Note: See docs/Theme-Foundation.md for the full specification.

- Section test checklist
  - [ ] Typecheck pass (lint deferred): `cd frontend && npm run typecheck`
  - [ ] Basic render smoke test: mount root app with theme imports and assert it renders without errors
  - [ ] Document any token adjustments if contrast issues are found

2. PrimeVue configuration and global styles
   - [x] Select a sober base theme (start from Aura) and override tokens for our palette
   - [x] Add global reset/normalization and base typography
   - [x] Set global container widths, grid helpers, and utility classes for layout spacing

3. App shell and layout
   - [x] Create `AppLayout` with header, collapsible sidebar, content area, and footer
   - [x] Add responsive behavior (mobile: overlay sidebar; desktop: fixed)
   - [x] Add breadcrumb and dynamic page title region
   - [x] Add user menu (avatar, name placeholder, logout action) and theme toggle
   
   Note: Spec prepared in docs/AppLayout-Plan.md (no code yet).

## Routing and Navigation

4. Router and guards (dummy only)
   - [x] Define routes: `/login`, `/` (Dashboard), `/collaborators`, `/certificates`, `/certificates/new`, and 404
   - [x] Keep a simple dummy auth guard using in-memory flag/localStorage (no API)
   - [x] Configure basic role meta placeholders for future use (no enforcement yet)

5. Navigation components
   - [x] Sidebar menu with active route highlighting
   - [x] Topbar quick actions (e.g., “New Certificate”)
   - [x] Breadcrumbs tied to route meta

- Section test checklist
  - [x] Router unit tests: routes exist, guards redirect unauthenticated to login, nested routes render
  - [x] Update/extend `src/router.spec.ts` with added cases
  - [x] Typecheck pass (lint deferred)

## Base Components

6. Form primitives
   - [x] `BaseInput`, `BasePassword`, `BaseSelect`, `BaseDate`, `BaseTextarea`
   - [x] `FormField` wrapper with label, help, and error slot
   - [x] Input masks and formatters (CPF, dates) — client-side only
   
   Note: Spec prepared in docs/BaseComponents-Plan.md (no code yet).

7. Display and layout
   - [x] `PageHeader` (title, subtitle, actions)
   - [x] `StatCard` (icon, title, value, trend placeholder)
   - [x] `DataTable` wrapper for PrimeVue table with empty/ loading states
   - [x] `Toolbar` and `Card` wrappers

8. Feedback and overlays
   - [x] `ConfirmDialog` (reusable)
   - [x] `SidePanel`/Drawer for details
   - [x] Toast/notification service (PrimeVue Toast)

- Section test checklist
 - [x] Render tests for form primitives and `FormField` error display
  - [x] Snapshot/basic interaction tests for `DataTable` wrapper, `ConfirmDialog`, `SidePanel`, toast
  - [x] Typecheck pass (lint deferred)

## Pages and Flows (Dummy Data Only)

9. Login
   - [x] Email + password fields with basic validation
   - [x] Show/hide password control
   - [x] Remember-me checkbox (local only)
   - [x] On submit, set a dummy session token and route to Dashboard

10. Dashboard
   - [x] Page header and quick actions (e.g., “Novo Atestado”)
   - [x] Stat cards (placeholders): total collaborators, total certificates, active leaves
   - [x] Recent activity list (dummy items)
   - [x] Placeholder charts (static images or empty components)

11. Collaborators (List + Create/Edit)
   - [x] List table with columns: Name, CPF, Department, Position, Status, Actions
   - [x] Filters: search by name/CPF, status; pagination controls (client-only)
   - [x] Action: View details (drawer or modal)
   - [x] Action: Edit (modal or route) with form: full name, CPF, birth date, position, department, status
   - [x] Action: New collaborator (modal), with client-side validation and success toast
   - [x] Confirm dialog for activating/deactivating (no persistence beyond local mocks)

12. Certificates (List + Details)
   - [x] List table with columns: Collaborator, Dates (start–end), Days, ICD code/title, Status, Actions
   - [x] Filters: collaborator (select/search), period (date range), status, ICD (text)
   - [x] Pagination (client-only)
   - [x] Sorting (client-only)
   - [x] Action: View details (drawer/modal) with full record
   - [x] Action: Cancel certificate (confirm dialog; toggle local status)

13. New Certificate (Form)
   - [x] Collaborator selector: search/select modal or simple dropdown populated from mocks
   - [x] Dates: start and end date pickers, auto-calc days (editable)
   - [x] Diagnosis (textarea)
   - [x] ICD search field: local dummy autocomplete (no API) with a small mock list
   - [ ] Optional attachments placeholder (no upload)
   - [x] Client-side validation and submit to add to local list

14. Not Found (404)
   - [x] Minimal friendly 404 page and link back to Dashboard

Note: Specs prepared in docs/Pages-Plan.md (no code yet).

- Section test checklist
  - [x] Render tests for pages: Login, Dashboard, Collaborators, Certificates, NewCertificate, 404
  - [x] Navigation tests: sidebar links route to expected views
  - [x] Typecheck pass (lint deferred)

## Modals and Reusable UX

15. Global confirm dialogs
   - [x] Standardized title/description, destructive style for risky actions
   - [x] Keyboard accessibility and focus management

16. Details drawer/modal patterns
   - [x] Collaborator details drawer with tabs (Profile, Certificates)
   - [x] Certificate details modal (summary, actions)

17. Empty, loading, and error states (local)
   - [x] Table empty states with helpful copy
   - [x] Skeleton loaders for key views
   - [x] Non-blocking error banners for form validation

- Section test checklist
  - [x] Open/close and focus-trap tests for modals/drawers
  - [x] ConfirmDialog: confirm/cancel emits expected events
  - [x] Typecheck pass (lint deferred)

## Mock Data, State, and Utilities (No API)

18. Local mock data
   - [x] Define fixtures in `src/mocks/` (users, collaborators, certificates, ICD list)
   - [x] Utility functions for basic CRUD against in-memory arrays
   - [ ] Seed mocks on app start (dev only)

19. State management (Pinia)
   - [x] Stores: `auth`, `collaborators`, `certificates`, `ui`
   - [x] Actions work on local fixtures only; simulate latency with `setTimeout` where needed
   - [x] Derivations: active certificates, filters, counts

20. Helpers and formatting
   - [x] CPF/Date/Number formatters
   - [x] Date range helpers (calculate days, clamp ranges)

- Section test checklist
  - [x] Store tests for local CRUD and derived getters (Pinia stores)
  - [x] Utility tests for CPF/date formatting and range helpers
  - [x] Typecheck pass (lint deferred)

## Accessibility, Responsiveness, and Polish

21. Accessibility (WCAG AA baseline)
   - [x] Color contrast checks for theme
   - [x] Semantic HTML in components
   - [x] Keyboard navigation: focus outlines, trap focus in modals, skip links
   - [x] ARIA labels/roles on interactive elements

22. Responsiveness
   - [x] Mobile-first layout for all pages and modals
   - [x] Tables collapse to cards at small breakpoints
   - [x] Test at common widths (360, 768, 1024, 1280)

23. UX refinements
   - [x] Consistent spacing and typography scale
   - [x] Hover/active states and subtle transitions
   - [x] Toast messages for success/error (local only)

- Section test checklist
  - [x] Basic a11y assertions: presence of aria-labels/roles on key components
  - [x] Responsive behavior sanity: jsdom-based width toggles for sidebar collapse logic
  - [ ] Lint/typecheck pass

## Validation, Testing, and QA (UI-only)

24. Form validation (client-only)
   - [x] Required fields, formats (email, CPF), date ranges
   - [x] Inline errors + disabled submit until valid

25. Component tests (optional but recommended)
   - [x] Configure Vitest + Vue Test Utils for basic render/interaction tests
   - [x] Snapshot key components (`BaseInput`, `DataTable` wrapper, `ConfirmDialog`)

26. QA checklist
   - [x] All routes reachable via sidebar and direct URL
   - [x] All modals/drawers open/close and trap focus correctly
   - [x] Forms validate and show feedback; mock data updates visible
   - [x] Theme consistent across pages; dark mode (if added) holds state

- Section test checklist
  - [ ] Full test suite: `npm run test` with coverage summary
  - [ ] Typecheck pass (lint deferred)
  - [ ] Address flaky tests and document gaps

## Documentation and Handover

27. Developer docs
   - [ ] Update `frontend/README` section with run instructions and mock data notes
   - [ ] Document theme tokens and how to extend components
   - [ ] Explain the no-API scope and where to hook real services later

28. Demo script
- [ ] Outline steps for a UI-only walkthrough covering all pages, forms, and modals

- Section test checklist
  - [ ] Run full checks (typecheck/tests; lint deferred) and update README with how to run tests
  - [ ] Capture a short checklist of what to verify during the demo

---

Out of scope for this phase: Any backend communication, token handling beyond a local dummy, real ICD API calls, persistence beyond in-memory mocks, and server-driven authorization. API integration will be implemented in a later phase after GUI validation.
