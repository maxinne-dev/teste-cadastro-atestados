# UI-Only Demo Script

Objective: Walk through the entire GUI without any backend. Validate navigation, forms, overlays, responsive behavior, and accessibility cues.

## Setup
- `cd frontend && npm ci && npm run dev`
- Ensure no server is running for the backend; everything uses mocks.

## 1) Login
- Navigate to `/login` (or start unauthenticated to be redirected).
- Enter any corporate-looking email and any password.
- Note: invalid entries disable submit and show banner on submit.
- On success, you land on Dashboard.

## 2) Dashboard
- Observe page header and stat cards.
- Use the topbar quick action “Novo Atestado” to open the new certificate form (routing only, no API).
- Try theme toggle (sun/moon); dark mode persists on reload.

## 3) Navigation (Sidebar)
- Click “Colaboradores” and “Atestados” to route between pages.
- Breadcrumb shows at the top of content area.

## 4) Colaboradores
- Use the search and status filters; see table pagination/sorting.
- Click “Ver” to open details drawer; switch tabs.
- Click “Editar” to open side panel form; note client-side validation.
- Click “Novo” to create a collaborator; invalid fields show inline errors and banner, success shows toast.
- Toggle status via confirm dialog; no persistence beyond mock arrays.

## 5) Atestados
- Filter by collaborator, dates, status, and CID text; try sorting by dates/days.
- Open Details (modal) to view full record; cancel (active only) to change status (confirm dialog).

## 6) Novo Atestado
- Choose a collaborator, pick start and end dates; days auto-calc.
- Enter diagnosis; search CID with local autocomplete; pick an option.
- Submit to add to the local list; you are routed back to Atestados.
- Invalid form shows a banner and disables submit.

## 7) Accessibility
- Use Tab to navigate; focus outlines visible.
- Activate skip link by tabbing from the top; jumps to content region.
- In a modal/drawer, Tab/Shift+Tab cycles focus. Close with Escape.
- Table headers with sorting announce `aria-sort` and show icons.

## 8) Responsiveness
- Narrow viewport (~360–768px): sidebar becomes an overlay; hamburger opens/closes.
- Data tables collapse to card layout below tablet sizes when `#card` slot is provided.

## Notes
- No API calls; all data is local (see `src/mocks/data.ts`).
- Integration points: replace mock operations inside Pinia stores (`src/stores/*`) with real services later.
