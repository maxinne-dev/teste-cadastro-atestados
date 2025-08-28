# Base Components — Specification (No Code)

This document specifies the reusable base components for the GUI-only phase. No API integration or data fetching is involved. Components standardize visuals, validation display, accessibility, and interaction.

Out of scope: Real persistence, backend validation, and file uploads. All behavior is client-only.

## Principles
- Token-driven styles: spacing, colors, radii, elevation from `tokens.css`.
- A11y first: labels/aria, focus management, keyboard operability, helpful error text.
- Small, composable components with predictable props and events.
- Validation: client-side only; errors passed via props.

## Form Primitives

1) FormField
- Purpose: Wrapper providing label, description/help, error, and layout for a single field.
- Props:
  - `label: string`
  - `hint?: string`
  - `error?: string | string[]` (renders list if array)
  - `required?: boolean`
  - `for?: string` (htmlFor to tie to input id)
- Slots: `default` (input), `extra` (right-aligned adornments)
- A11y: Associates label with control via `for`/`id`, sets `aria-invalid` when error.

2) BaseInput
- Props: `modelValue: string`, `placeholder?: string`, `disabled?: boolean`, `readonly?: boolean`, `type?: 'text' | 'email' | 'tel' | 'number'` (default text), `autocomplete?: string`, `id?: string`, `maxlength?: number`
- Emits: `update:modelValue`, `blur`, `focus`
- Behavior: Controlled input; optional clear button (if not disabled/readonly).
- A11y: forwards `aria-*` attrs; sets `aria-invalid` via parent FormField.

3) BasePassword
- Props: `modelValue: string`, `placeholder?: string`, `toggle?: boolean` (show/hide), `id?: string`
- Emits: `update:modelValue`
- Behavior: Eye icon toggles visibility when `toggle`.

4) BaseTextarea
- Props: `modelValue: string`, `placeholder?: string`, `rows?: number`, `maxlength?: number`, `autoResize?: boolean`
- Emits: `update:modelValue`

5) BaseSelect
- Props: `modelValue: string | number | null`, `options: Array<{ label: string; value: string | number }>`
  - Optional: `clearable?: boolean`, `filterable?: boolean`, `placeholder?: string`, `id?: string`
- Emits: `update:modelValue`, `change`
- Behavior: Renders PrimeVue `Dropdown` under the hood (later), with our tokens.

6) BaseDate
- Props: `modelValue: string | Date | null`, `placeholder?: string`, `min?: string | Date`, `max?: string | Date`
- Emits: `update:modelValue`, `change`
- Behavior: Single date; we will add a separate date-range when needed.

7) Masks/Formatters (helpers only, not components)
- CPF mask and normalization: `000.000.000-00` formatting; provide `formatCpf(value)` and `normalizeCpf(value)` helpers (client-only, no validation beyond shape).
- Date formatting: ISO strings to human-readable (DD/MM/YYYY) and back.

## Display and Layout

8) PageHeader
- Purpose: Consistent page header with title, subtitle, and action slot.
- Props: `title: string`, `subtitle?: string`
- Slots: `actions`

9) StatCard
- Purpose: Compact metric card with icon, title, value, optional delta.
- Props: `icon?: string`, `title: string`, `value: string | number`, `delta?: string`, `severity?: 'neutral' | 'success' | 'warning' | 'danger'`

10) DataTable (wrapper)
- Purpose: Thin wrapper around PrimeVue `DataTable` standardized with our empty/loading states and spacing.
- Props:
  - `rows: any[]` (client-only array)
  - `loading?: boolean`
  - `emptyMessage?: string`
  - `total?: number` (for pagination UI only; client-side)
  - `page?: number`, `rowsPerPage?: number`
- Slots: `columns` (scoped), `header`, `footer`, `empty`
- Behavior: Emits `update:page`, `update:rowsPerPage`, `sort` events; no server calls.

11) Toolbar and Card wrappers
- Provide consistent padding, background, and elevation using tokens.
- Slots only; no logic.

## Feedback & Overlays

12) ConfirmDialog
- Props: `visible: boolean`, `title: string`, `message?: string`, `confirmLabel?: string`, `cancelLabel?: string`, `severity?: 'neutral' | 'danger'`
- Emits: `confirm`, `cancel`, `update:visible`
- Behavior: Focus trap; Escape closes as cancel; confirm is primary.

13) SidePanel (Drawer)
- Props: `visible: boolean`, `title?: string`, `position?: 'right' | 'left'` (default right), `width?: string`
- Emits: `update:visible`
- Slots: `default`, `header`, `footer`
- Behavior: Trap focus when open, close on backdrop click and Escape.

14) Toast service setup (UI-only)
- Provide a centralized `useToast()` wrapper around PrimeVue’s toast with mapping to our severities. Use only in UI for local feedback.

## Accessibility
- Each input associates label/description/error via `id`, `aria-describedby`.
- Keyboard support: Tab order predictable; Enter triggers primary button in dialogs.
- Color contrast per Theme Foundations.

## Deliverables (when implementing)
- Components: FormField, BaseInput, BasePassword, BaseTextarea, BaseSelect, BaseDate; PageHeader, StatCard, DataTable wrapper, Toolbar, Card; ConfirmDialog, SidePanel; toast setup.
- Story-like playgrounds or simple example usage in views to validate visuals (no API).
- Tests (after implementation): render + interaction tests per TASKS.md checklists.

No code is included here — this is a spec to guide implementation in the next step.
