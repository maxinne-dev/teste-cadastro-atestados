# App Shell & Layout — Specification (No Code)

This document defines the App shell for the dummy GUI: header/topbar, collapsible sidebar, content area with breadcrumbs and actions, and a minimal footer. It specifies behavior, structure, accessibility, and PrimeVue components to use. Do not implement code here; this is a guide for the build phase.

## Objectives
- Provide a consistent, responsive layout for all authenticated views.
- Keep visuals modern and sober, aligned with Theme Foundations and tokens.
- Ensure solid keyboard and screen-reader accessibility.

## IA & Navigation
- Routes to support: `/` (Dashboard), `/collaborators`, `/certificates`, `/certificates/new`, and `/login` (outside shell), plus a `404` page.
- Sidebar items (icons are PrimeIcons):
  - Dashboard (`/`) — pi pi-home
  - Collaborators (`/collaborators`) — pi pi-users
  - Certificates (`/certificates`) — pi pi-id-card
  - New Certificate (`/certificates/new`) — pi pi-file-edit
- Active route: highlight using brand color and a left border/indicator.
- Optional future groups: “Admin”, “Settings” (placeholders only; not implemented now).

## Regions
1) Topbar/Header
- Left: app logo/title (text placeholder), optional collapsible button (hamburger) on small screens.
- Center: breadcrumb trail (or keep breadcrumbs above content area; pick one location and be consistent).
- Right: actions and menus
  - Primary action: “New Certificate” (navigates to `/certificates/new`)
  - Theme toggle (light/dark/system; local only)
  - User menu: avatar + name placeholder; items: Profile (placeholder route), Logout (clears dummy token)
- Elevation: `--elev-1`, surface-2 background.

2) Sidebar (Collapsible)
- Desktop: fixed, collapsible to a narrow rail (icons only). Widths: 240px expanded, 64px collapsed.
- Mobile: hidden by default; opens as an overlay drawer over content. Close on ESC or backdrop click.
- Content: app nav list with groups (if any), flat list for now.
- A11y: `role="navigation"`, landmark label, focus trap when open (mobile), keyboard-operable collapse/expand toggle.

3) Content Area
- Container uses `.container` helper (see global styles).
- Page header section at top of content area:
  - Title (h1) and optional subtitle
  - Right-aligned page-level actions slot (e.g., filters, “New” button when not in topbar)
- Below header: default slot for the page’s components.
- Empty/loading states and breadcrumbs positioning clarified per view.

4) Footer (Minimal)
- Small text with version placeholder or copyright.
- Fixed to bottom only if content is shorter than viewport; otherwise follows content.

## Responsive Behavior
- Breakpoints: follow container widths from global.css (720/1024/1280/1440).
- Mobile: sidebar overlays; topbar condenses actions (hide labels, keep icons). Breadcrumbs may collapse to current page only.
- Touch targets: min 44x44px for actionable items.

## Accessibility
- Keyboard
  - TAB order: topbar controls → sidebar (if open) → content.
  - ESC closes sidebar (mobile) and any open menu/overlay.
  - Focus styles: use `--focus-color` and `--focus-width` tokens.
- ARIA
  - Sidebar: `role=navigation`, `aria-label="Main"`.
  - Breadcrumbs: `nav[aria-label="Breadcrumb"] > ol > li` semantics.
  - Toggle buttons: `aria-pressed`/`aria-expanded` as appropriate.
- Screen reader
  - “Skip to content” link at top of page.

## PrimeVue Components
- Topbar: `Button`, `Avatar`, `Menu` or `TieredMenu` for user menu, `OverlayPanel` (optional), `ToggleSwitch` (theme toggle if desired).
- Sidebar: PrimeVue `Sidebar` for mobile overlay, or custom panel for desktop. Use `Menu` for the navigation list (or a custom list with `router-link`).
- Breadcrumbs: PrimeVue `Breadcrumb` bound to route meta.
- Buttons: PrimeVue `Button` with `severity` mapped to tokens.

## Route Meta Conventions
- Each route defines:
  - `meta.title`: short page title.
  - `meta.breadcrumb`: array of `{ label, to? }` forming the trail.
  - `meta.requiresAuth`: boolean.
- AppLayout uses `route.meta.title` in the page header and renders breadcrumbs if present.

## Component Structure (proposed)
- `src/layouts/AppLayout.vue`
  - Slots: `page-actions` (right side of page header), default (page content)
  - Internals: `<AppTopbar />`, `<AppSidebar />`, `<AppBreadcrumbs />` (if not placed in topbar), `<AppFooter />`
- `src/components/AppTopbar.vue`: logo/title, breadcrumb or title, actions (new cert), theme toggle, user menu
- `src/components/AppSidebar.vue`: collapsible nav list; emits `toggle` and close events
- `src/components/AppBreadcrumbs.vue`: renders from route meta
- `src/components/AppFooter.vue`: minimal footer

## Theming & Tokens
- Use tokens from `tokens.css` for spacing, radii, elevation, and colors.
- Surfaces: topbar uses `--color-surface-2`; sidebar uses `--color-surface`; content background `--color-bg`.
- Active nav item: background slight tint of primary (e.g., 8–10% alpha), left border 3px primary.

## States & Micro-interactions
- Collapsing sidebar: 150ms ease transitions on width and icon label opacity.
- Hover states for nav entries and buttons per tokens; keep subtle.
- Persist sidebar collapsed state in `localStorage` key `sidebar:collapsed`.

## Deliverables (when implementing)
- App shell components listed above with responsive behavior.
- Dummy-only wiring: user menu actions affect local state only (no API).
- Breadcrumbs driven by route meta; titles consistent across pages.
- No API integration; all interactivity is client-side.

## Out of Scope (this phase)
- Real authentication, role-based visibility, or server-driven menus.
- Fetching user profile or branding from backend.
- Any API calls; this remains a GUI-only dummy shell.
