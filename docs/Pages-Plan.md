# Pages & Flows — Specification (GUI-only, No API)

This document specifies the dummy UI pages: Login, Dashboard, Collaborators, Certificates (list and new), and 404. Scope is GUI only — no API integration. Use local mock stores/data and client-side validation.

General
- Layout: All authenticated pages render inside `AppLayout` with topbar, sidebar, page header, breadcrumbs, and footer.
- Navigation: Sidebar routes; breadcrumbs from route meta; page titles are route meta.title.
- Feedback: Use `useNotify()` for toasts; use `ConfirmDialog` and `SidePanel` patterns from Base Components as needed.
- Accessibility: Labels, roles, keyboard access, focus management for dialogs and overlays.

## 1) Login

Purpose: Authenticate user (dummy). Sets a local dummy token and redirects to Dashboard. No server calls.

Structure
- Minimal centered card with brand/title.
- Form
  - Email: `BaseInput` type=email
  - Password: `BasePassword` with show/hide
  - Remember me: simple checkbox (local only)
  - Submit button: primary
- Validation (client-only)
  - Email: non-empty, simple `/.+@.+\..+/` check
  - Password: non-empty
- Behavior
  - On submit, if valid: set `localStorage.setItem('token','dev')` and `router.push('/')`
  - On invalid: show inline errors via `FormField` + error strings; toast optional
- A11y
  - Labels, `aria-invalid` on errors; submit button disabled until valid

Acceptance
- Form validates; success stores dummy token and navigates to Dashboard.
- Keyboard-only users can complete login.

## 2) Dashboard

Purpose: Quick system overview and shortcuts. Static placeholders only.

Structure
- PageHeader: title "Dashboard"
- Content
  - Row of 3–4 `StatCard`s (e.g., Collaborators, Certificates, Active Leaves, Pending Actions) with static numbers
  - `Card` with a simple list: Recent activity (dummy items)
  - Optional second `Card` with placeholder chart area (static image or empty div)
- Actions
  - Topbar "Novo Atestado" button routes to New Certificate

Acceptance
- Navigates from sidebar; page renders stat cards and placeholder content.

## 3) Collaborators (List + Details + Create/Edit)

Purpose: Manage collaborators in the dummy UI using local mock data.

Routes & Meta
- Route: `/collaborators`
- Meta: title "Colaboradores", breadcrumb [Dashboard > Colaboradores]

Structure
- PageHeader: title + actions slot ("Novo" button)
- Filters Toolbar
  - Search field (name/CPF) using `BaseInput`
  - Status select: `BaseSelect` (All/Active/Inactive)
- List
  - `DataTable` wrapper
    - Columns: Name, CPF, Department, Position, Status, Actions
    - Actions: View (drawer), Edit (modal), Activate/Deactivate (confirm)
- Details Drawer (SidePanel)
  - Tabs (text-only or simple stack): Profile info, Recent Certificates (dummy list)
- Create/Edit Modal (ConfirmDialog not needed; use a `SidePanel` or simple modal)
  - FormFields: Full Name, CPF, Birth Date (BaseDate), Position, Department, Status
  - Validation: required fields; CPF mask/normalize (format-only)
  - On submit: update local mock store and show success toast

Behavior
- All CRUD operations update in-memory array only. No persistence.
- Filters and search are client-side.

Acceptance
- Can create, edit, and toggle status of collaborators in memory.
- Drawer and modal open/close properly with focus management.

## 4) Certificates (List + Details)

Purpose: Browse existing certificates, filter, and inspect details using dummy data.

Routes & Meta
- Route: `/certificates`
- Meta: title "Atestados", breadcrumb [Dashboard > Atestados]

Structure
- PageHeader: title + actions slot (optional: link to New Certificate)
- Filters Toolbar
  - Collaborator filter: `BaseSelect` (populated from mock collaborators)
  - Period filter: two `BaseDate` inputs or a date range (simplified)
  - Status filter: `BaseSelect` (All/Active/Cancelled/Expired)
  - Text filter: ICD text (free text)
- List
  - `DataTable` wrapper with columns: Collaborator, Start–End dates, Days, ICD code/title, Status, Actions
  - Actions: View Details (SidePanel), Cancel (ConfirmDialog changing local status)
- Details (SidePanel)
  - Summary fields (read-only)

Behavior
- Filtering and pagination are client-side.
- Cancel toggles status locally and shows a toast.

Acceptance
- Filters update list; details drawer shows certificate; cancel toggles status.

## 5) New Certificate (Form)

Purpose: Create a new certificate entry in memory.

Routes & Meta
- Route: `/certificates/new`
- Meta: title "Novo Atestado", breadcrumb [Dashboard > Atestados > Novo]

Structure
- PageHeader: title + actions slot (optional Save button; primary located within form is fine)
- Form (Card)
  - Collaborator: `BaseSelect` or modal selector from mock list
  - Start Date / End Date: `BaseDate` inputs
  - Days: derived from dates but editable `BaseInput` type=number
  - Diagnosis: `BaseTextarea`
  - ICD Search: Local dummy autocomplete (NO API). Use a small hardcoded list in mock state and filter by input; render as a simple dropdown under the field.
  - Attachments: placeholder only (no upload)
- Validation (client-only)
  - Required: collaborator, start, end, days > 0
  - Date range: end >= start; days derived if empty
- Behavior
  - On submit: push into local certificates array; toast success; navigate to Certificates list

Acceptance
- Valid form adds a new row to the list in-memory and navigates; invalid shows inline errors.
- ICD search uses local list only; no network.

## 6) Not Found (404)

Purpose: Friendly page for unknown routes.

Structure
- Illustration/icon + message
- Link/button back to Dashboard

Acceptance
- Navigating to an unknown path shows 404 and lets user go home.

## Testing Notes (per TASKS.md)
- Page render tests for all pages.
- Navigation tests: sidebar links route to the expected views; breadcrumbs render from meta.
- Forms: validation messages show for invalid input; successful actions mutate mock state and show toasts.
- Overlays: SidePanels and dialogs open/close; focus management basics covered.

No API integration shall be implemented in these pages. All data interactions rely on local mocks/state only.
