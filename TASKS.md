# Frontend GUI Tasks — Dummy UI Only (No API Integration)

This plan covers building a complete, modern, and sober GUI in `frontend/` using Vue 3 + PrimeVue, with navigable pages, modals, and forms backed by local mock data only. No API integration should be implemented at this stage.

Important: Do NOT call or depend on any backend API. Use local fixtures/mocks so the whole UI runs and can be validated visually and functionally (routing, navigation, validation) without a server.

## Foundations and Theme

1. Design tokens and theme setup
   - [ ] Define neutral color palette (primary/secondary, success/warn/error, surface, text, dark mode)
   - [ ] Establish spacing scale, radius, shadows, typography (font family/size/line-height)
   - [ ] Create CSS variables (e.g., `:root { --color-primary: ... }`) and map to PrimeVue theme where applicable
   - [ ] Configure dark mode toggle (optional, if time allows) with prefers-color-scheme and manual override

2. PrimeVue configuration and global styles
   - [ ] Select a sober base theme (start from Aura) and override tokens for our palette
   - [ ] Add global reset/normalization and base typography
   - [ ] Set global container widths, grid helpers, and utility classes for layout spacing

3. App shell and layout
   - [ ] Create `AppLayout` with header, collapsible sidebar, content area, and footer
   - [ ] Add responsive behavior (mobile: overlay sidebar; desktop: fixed)
   - [ ] Add breadcrumb and dynamic page title region
   - [ ] Add user menu (avatar, name placeholder, logout action) and theme toggle

## Routing and Navigation

4. Router and guards (dummy only)
   - [ ] Define routes: `/login`, `/` (Dashboard), `/collaborators`, `/certificates`, `/certificates/new`, and 404
   - [ ] Keep a simple dummy auth guard using in-memory flag/localStorage (no API)
   - [ ] Configure basic role meta placeholders for future use (no enforcement yet)

5. Navigation components
   - [ ] Sidebar menu with active route highlighting
   - [ ] Topbar quick actions (e.g., “New Certificate”)
   - [ ] Breadcrumbs tied to route meta

## Base Components

6. Form primitives
   - [ ] `BaseInput`, `BasePassword`, `BaseSelect`, `BaseDate`, `BaseTextarea`
   - [ ] `FormField` wrapper with label, help, and error slot
   - [ ] Input masks and formatters (CPF, dates) — client-side only

7. Display and layout
   - [ ] `PageHeader` (title, subtitle, actions)
   - [ ] `StatCard` (icon, title, value, trend placeholder)
   - [ ] `DataTable` wrapper for PrimeVue table with empty/ loading states
   - [ ] `Toolbar` and `Card` wrappers

8. Feedback and overlays
   - [ ] `ConfirmDialog` (reusable)
   - [ ] `SidePanel`/Drawer for details
   - [ ] Toast/notification service (PrimeVue Toast)

## Pages and Flows (Dummy Data Only)

9. Login
   - [ ] Email + password fields with basic validation
   - [ ] Show/hide password control
   - [ ] Remember-me checkbox (local only)
   - [ ] On submit, set a dummy session token and route to Dashboard

10. Dashboard
   - [ ] Page header and quick actions (e.g., “Novo Atestado”)
   - [ ] Stat cards (placeholders): total collaborators, total certificates, active leaves
   - [ ] Recent activity list (dummy items)
   - [ ] Placeholder charts (static images or empty components)

11. Collaborators (List + Create/Edit)
   - [ ] List table with columns: Name, CPF, Department, Position, Status, Actions
   - [ ] Filters: search by name/CPF, status; pagination controls (client-only)
   - [ ] Action: View details (drawer or modal)
   - [ ] Action: Edit (modal or route) with form: full name, CPF, birth date, position, department, status
   - [ ] Action: New collaborator (modal), with client-side validation and success toast
   - [ ] Confirm dialog for activating/deactivating (no persistence beyond local mocks)

12. Certificates (List + Details)
   - [ ] List table with columns: Collaborator, Dates (start–end), Days, ICD code/title, Status, Actions
   - [ ] Filters: collaborator (select/search), period (date range), status, ICD (text)
   - [ ] Pagination and sorting (client-only)
   - [ ] Action: View details (drawer/modal) with full record
   - [ ] Action: Cancel certificate (confirm dialog; toggle local status)

13. New Certificate (Form)
   - [ ] Collaborator selector: search/select modal or simple dropdown populated from mocks
   - [ ] Dates: start and end date pickers, auto-calc days (editable)
   - [ ] Diagnosis (textarea)
   - [ ] ICD search field: local dummy autocomplete (no API) with a small mock list
   - [ ] Optional attachments placeholder (no upload)
   - [ ] Client-side validation and submit to add to local list

14. Not Found (404)
   - [ ] Minimal friendly 404 page and link back to Dashboard

## Modals and Reusable UX

15. Global confirm dialogs
   - [ ] Standardized title/description, destructive style for risky actions
   - [ ] Keyboard accessibility and focus management

16. Details drawer/modal patterns
   - [ ] Collaborator details drawer with tabs (Profile, Certificates)
   - [ ] Certificate details modal (summary, actions)

17. Empty, loading, and error states (local)
   - [ ] Table empty states with helpful copy
   - [ ] Skeleton loaders for key views
   - [ ] Non-blocking error banners for form validation

## Mock Data, State, and Utilities (No API)

18. Local mock data
   - [ ] Define fixtures in `src/mocks/` (users, collaborators, certificates, ICD list)
   - [ ] Utility functions for basic CRUD against in-memory arrays
   - [ ] Seed mocks on app start (dev only)

19. State management (Pinia)
   - [ ] Stores: `auth`, `collaborators`, `certificates`, `ui`
   - [ ] Actions work on local fixtures only; simulate latency with `setTimeout` where needed
   - [ ] Derivations: active certificates, filters, counts

20. Helpers and formatting
   - [ ] CPF/Date/Number formatters
   - [ ] Date range helpers (calculate days, clamp ranges)

## Accessibility, Responsiveness, and Polish

21. Accessibility (WCAG AA baseline)
   - [ ] Color contrast checks for theme
   - [ ] Semantic HTML in components
   - [ ] Keyboard navigation: focus outlines, trap focus in modals, skip links
   - [ ] ARIA labels/roles on interactive elements

22. Responsiveness
   - [ ] Mobile-first layout for all pages and modals
   - [ ] Tables collapse to cards at small breakpoints
   - [ ] Test at common widths (360, 768, 1024, 1280)

23. UX refinements
   - [ ] Consistent spacing and typography scale
   - [ ] Hover/active states and subtle transitions
   - [ ] Toast messages for success/error (local only)

## Validation, Testing, and QA (UI-only)

24. Form validation (client-only)
   - [ ] Required fields, formats (email, CPF), date ranges
   - [ ] Inline errors + disabled submit until valid

25. Component tests (optional but recommended)
   - [ ] Configure Vitest + Vue Test Utils for basic render/interaction tests
   - [ ] Snapshot key components (`BaseInput`, `DataTable` wrapper, `ConfirmDialog`)

26. QA checklist
   - [ ] All routes reachable via sidebar and direct URL
   - [ ] All modals/drawers open/close and trap focus correctly
   - [ ] Forms validate and show feedback; mock data updates visible
   - [ ] Theme consistent across pages; dark mode (if added) holds state

## Documentation and Handover

27. Developer docs
   - [ ] Update `frontend/README` section with run instructions and mock data notes
   - [ ] Document theme tokens and how to extend components
   - [ ] Explain the no-API scope and where to hook real services later

28. Demo script
   - [ ] Outline steps for a UI-only walkthrough covering all pages, forms, and modals

---

Out of scope for this phase: Any backend communication, token handling beyond a local dummy, real ICD API calls, persistence beyond in-memory mocks, and server-driven authorization. API integration will be implemented in a later phase after GUI validation.

