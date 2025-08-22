# Theme Foundations (GUI-Only, No API, No Code Yet)

This document defines a modern, sober theme and the design token system for the Vue 3 + PrimeVue frontend. It is a specification only — do not implement CSS or code in this phase. Use these decisions to guide later styling work.

## Objectives
- Provide a calm, professional UI suitable for healthcare/HR workflows.
- Ensure accessibility (WCAG 2.1 AA) and good contrast.
- Keep the palette neutral and understated; use color for emphasis and status.
- Enable dark mode without visual noise.

## Color System

Tokens use a neutral-first palette with subtle color accents. Values define both light and dark modes.

- Primary: brand/action color
  - Light: #2563EB (blue-600)
  - Dark: #60A5FA (blue-400)
- Secondary: subtle emphasis
  - Light: #7C3AED (violet-600)
  - Dark: #A78BFA (violet-400)
- Success: confirmations
  - Light: #16A34A (green-600)
  - Dark: #34D399 (emerald-400)
- Warning: cautions
  - Light: #D97706 (amber-600)
  - Dark: #FBBF24 (amber-400)
- Error: destructive/invalid
  - Light: #DC2626 (red-600)
  - Dark: #F87171 (red-400)
- Info: neutral notices
  - Light: #0891B2 (cyan-700)
  - Dark: #67E8F9 (cyan-300)

Neutrals and Surfaces
- Background
  - Light: #FFFFFF
  - Dark: #0B1220
- Surface (cards, tables)
  - Light: #F8FAFC (slate-50)
  - Dark: #111827 (gray-900)
- Surface-2 (elevated)
  - Light: #FFFFFF
  - Dark: #1F2937 (gray-800)
- Border/Subtle text
  - Light: #E5E7EB (gray-200)
  - Dark: #374151 (gray-700)
- Text Primary
  - Light: #0F172A (slate-900)
  - Dark: #E5E7EB (gray-200)
- Text Secondary
  - Light: #475569 (slate-600)
  - Dark: #9CA3AF (gray-400)
- Muted/Disabled
  - Light: #94A3B8 (slate-400)
  - Dark: #6B7280 (gray-500)

## Typography

- Font family: Inter, SF Pro Text, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, system-ui, -apple-system, sans-serif
- Line-height (default): 1.5; tighter for headings.
- Scale (px):
  - h1: 32/40
  - h2: 24/32
  - h3: 20/28
  - h4: 18/26
  - body-lg: 16/24
  - body: 14/22
  - caption: 12/18
- Weights: 600 for headings, 500 for buttons, 400 for body.

## Spacing, Radii, Elevation

- Spacing scale (px): 0, 4, 8, 12, 16, 20, 24, 32, 40, 48
  - Tokens: space-0..space-9 mapping respectively.
- Radii: 4, 8, 12, 9999 (pill) → radius-sm, radius-md, radius-lg, radius-pill
- Shadows (subtle, neutral):
  - elev-1: 0 1px 2px rgba(0,0,0,0.05)
  - elev-2: 0 2px 8px rgba(0,0,0,0.08)
  - elev-3: 0 8px 24px rgba(0,0,0,0.12)

## Interaction States

- Focus ring: 2px outline using primary at ~40% opacity on dark/light contrast backgrounds.
- Hover: increase surface brightness by +2% (light) or +3% (dark); buttons darken by ~6%.
- Active/Pressed: translateY(1px) and reduce brightness by ~6%.
- Disabled: reduce opacity to 60%, remove shadows.

## Dark Mode Strategy

- Theming driven by CSS variables applied to :root (light) and [data-theme="dark"] (dark).
- Default to system preference via prefers-color-scheme: dark; allow manual override by toggling the data attribute on <html>.
- Persist setting in localStorage key theme (light | dark | system).

## Token Names (Spec Only)

Names here are canonical; actual CSS/JS implementation happens later.

- Color
  - --color-primary, --color-secondary, --color-success, --color-warning, --color-error, --color-info
  - --color-bg, --color-surface, --color-surface-2, --color-border
  - --color-text, --color-text-muted, --color-text-secondary
  - Dark mode variants defined by redefining variables under [data-theme="dark"].
- Typography
  - --font-family-base, --font-weight-regular, --font-weight-medium, --font-weight-semibold
  - --fs-h1, --fs-h2, --fs-h3, --fs-h4, --fs-body, --fs-body-lg, --fs-caption
  - --lh-h1..--lh-caption
- Spacing & Radii
  - --space-0..--space-9
  - --radius-sm, --radius-md, --radius-lg, --radius-pill
- Elevation
  - --elev-1, --elev-2, --elev-3
- Focus & Effects
  - --focus-color, --focus-width

## PrimeVue Mapping Notes (Aura preset)

We will keep PrimeVue’s Aura preset and override via provided token APIs/variables later. Reference names below are indicative; confirm exact names when implementing.

- Map brand/status colors
  - Primary → --p-primary-color / semantic tokens exposed by Aura
  - Success/Warning/Error → --p-*-color equivalents for messages, badges, buttons
- Surfaces
  - --p-surface-ground, --p-surface-card, --p-surface-overlay, --p-surface-border
- Typography
  - --p-font-family, --p-text-color, --p-text-muted-color
- Radii & Shadows
  - --p-border-radius, component-specific radius tokens
  - Shadow tokens for overlays and raised components

Implementation plan when we get to styling tasks:
1) Define our CSS variables as above.
2) Bridge our tokens to PrimeVue token system in a single theme entry.
3) Keep overrides minimal; prefer semantic tokens instead of per-component overrides.

## Accessibility & Contrast

- Minimum contrast ratios
  - Text vs background: 4.5:1 (body), 3:1 (large text)
  - Icon-only buttons: ensure 3:1 via icon color vs surface
- Focus visibility: non-color indicator present (outline)
- Motion: limit micro-animations to <150ms with prefers-reduced-motion support

## Deliverables for This Task (Spec Only)
- Approved color palette for light/dark
- Token names and scales (spacing, radius, elevation, typography)
- Dark mode behavior decision
- Mapping approach to PrimeVue (Aura)

No stylesheets or code should be added now. The next step will use this spec to implement tokens and the app shell styling.
