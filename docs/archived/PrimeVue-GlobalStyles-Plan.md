# PrimeVue Configuration & Global Styles Plan (No Code Yet)

This is an implementation plan for setting up PrimeVue theming and project-wide global styles. It does not add code; it specifies what to implement next.

## Goals
- Keep Aura preset and minimally override via tokens for a sober, modern look.
- Centralize our tokens and ensure consistency across components and pages.
- Establish predictable global typography, layout containers, and utility classes.

## PrimeVue Theme Integration
- Preset: Keep `Aura` as base (already configured in `frontend/src/main.ts`).
- Approach: Introduce a single theme entry point that bridges our CSS variables to PrimeVue tokens.
- Structure (proposed file paths):
  - `src/styles/tokens.css` (CSS variables for light and dark)
  - `src/styles/theme-bridge.css` (maps our variables to PrimeVue token variables)
  - `src/styles/global.css` (reset, typography, base elements, containers)
- Loading order: `tokens.css` → `theme-bridge.css` → `global.css`.

## Token Bridge (Mapping)
- Map brand/status colors
  - Our: `--color-primary|success|warning|error|info`
  - To Aura tokens: `--p-primary-color`, status color tokens for buttons, messages, badges.
- Surfaces & Borders
  - Our: `--color-bg`, `--color-surface`, `--color-surface-2`, `--color-border`
  - To Aura tokens: `--p-surface-ground`, `--p-surface-card`, `--p-surface-overlay`, `--p-surface-border`.
- Typography
  - Our: `--font-family-base`, text colors
  - To Aura tokens: `--p-font-family`, `--p-text-color`, `--p-text-muted-color`.
- Radii & Elevation
  - Our: `--radius-*`, `--elev-*`
  - To Aura tokens: `--p-border-radius` and overlay/raised shadows.

## Global Styles
- Reset/Normalize
  - Use a minimal modern reset (e.g., `Eric Meyer Reset` or `Modern Normalize` conventions) embedded in `global.css` (no dependency).
  - Ensure `box-sizing: border-box` and consistent focus outlines.
- Typography
  - Base font family from Theme Foundations.
  - Set base sizes/line-heights via CSS variables and apply to headings/body.
- Containers & Layout
  - Define `.container` widths: 100% fluid with max-width breakpoints: 720px, 1024px, 1280px, 1440px, with responsive padding.
  - Grid helpers: `.row`, `.col` optional lightweight utilities or rely on PrimeFlex (if later adopted).
- Utilities
  - Spacing: a small set of margin/padding utilities (e.g., `.mt-4`, `.px-6`) mapped to `--space-*` tokens.
  - Visibility: `.sr-only` for screen-reader-only text, `.visually-hidden` pattern.
  - Elevation helpers: `.elev-1|2|3` applying `--elev-*`.

## Dark Mode
- Strategy: Set `[data-theme="dark"]` on `<html>` to switch.
- Persistence: Use `localStorage: theme` (`light|dark|system`).
- System default: Respect `prefers-color-scheme` when `system` is selected.

## App Shell Considerations
- Ensure `AppLayout` consumes container + spacing utilities for consistent gutters.
- Sidebar uses surface tokens; topbar uses surface-2 with elevation 1 or 2.
- Breadcrumbs and page titles use text secondary for subtitles and primary for headings.

## Rollout Steps (when implementing)
1) Create `tokens.css` with variables for light/dark from Theme Foundations.
2) Create `theme-bridge.css` mapping our variables to Aura tokens.
3) Create `global.css` with reset, typography, containers, utilities.
4) Import these files in `main.ts` (after PrimeVue) or in `App.vue` (global scope).
5) Add a minimal theme toggle composable (`useTheme`) later in the UI phase.

Note: No code is included here; this is a guide for the next implementation step.
