# Accessibility Contrast Report (WCAG 2.1 AA)

Scope: Validate base theme contrast for light and dark modes and ensure correct token mappings for body, secondary, and muted text. PrimeVue muted text is now mapped to our `--color-text-muted` to reflect intended usage.

## Summary
- Body text vs background: Pass (light: `#0F172A` on `#FFFFFF`; dark: `#E5E7EB` on `#0B1220`).
- Secondary text vs background: Pass (light: `#475569` on `#FFFFFF`; dark: `#9CA3AF` on `#0B1220`).
- Muted text vs background: Conditional. Intended for non-essential helper/placeholder text only. Mapping fixed so PrimeVue uses `--color-text-muted` for muted styles.
- Primary button text: Pass (white text on primary background) and outlined/tonal variants rely on underline or icon + label for affordance.
- Focus outlines: Visible non-color indicator using `outline` at 2px.

## Token Usage Guidance
- `--color-text`: Use for all body copy and core UI text.
- `--color-text-secondary`: Use for subtitles, captions, and non-primary labels at normal sizes.
- `--color-text-muted`: Use only for helper/placeholder/disabled text. Avoid for core content to ensure 4.5:1 ratio.

## Checks Performed
1) Verified token pairs in light and dark mode for body, secondary, and muted on default surfaces.
2) Verified PrimeVue mapping: `--p-text-muted-color` now points to `--color-text-muted` (was incorrectly mapped to secondary).
3) Spot-checked key components (Topbar, Sidebar, Page headers, DataTable empty state) for clear contrast and legibility.

## Notes / Follow-ups
- If any component uses muted text for essential copy, switch to `--color-text-secondary`.
- When implementing dark mode toggle, re-verify contrast on both modes for pages and overlays.
- Icon-only buttons should ensure at least 3:1 contrast with background; add explicit color where necessary.

Outcome: Baseline theme contrast verified; corrected muted text mapping aligns semantics and improves accessibility.

