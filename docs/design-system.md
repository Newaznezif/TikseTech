# TIKSE TECH design system

Version: 1.0  
Scope: public website, participant workspace, and manager workspace.

## Design principles

- **Clarity before decoration:** one primary action per page section, readable hierarchy, and predictable navigation.
- **Operational credibility:** show real platform data, distinguish empty states from failures, and never invent activity or metrics.
- **Consistent interaction:** reusable control sizes, focus treatment, field spacing, and status language.
- **Accessible by default:** semantic headings, visible labels, keyboard focus, reduced-motion support, and WCAG AA text contrast targets.

## Color tokens

| Token | Value | Purpose |
|---|---|---|
| --tt-bg | #f5f7fb | Application canvas |
| --tt-surface | #ffffff | Cards, forms, panels |
| --tt-surface-muted | #eef3f8 | Quiet panel backgrounds |
| --tt-ink | #101b2d | Primary text |
| --tt-muted | #5f6b7d | Secondary text |
| --tt-brand | #155eef | Primary links and actions |
| --tt-brand-strong | #1248bd | High-emphasis actions |
| --tt-accent | #14b8a6 | Accent and active states |
| --tt-border | #dce4ee | Dividers and field borders |
| --tt-success | #087f5b | Successful states |
| --tt-warning | #a16207 | Warnings and pending states |
| --tt-danger | #be123c | Errors and destructive states |

Contrast checks for token pairs: primary text on canvas **16.09:1**; muted text on canvas **5.04:1**; white on primary blue **5.41:1**; white on strong blue **7.81:1**; success on canvas **4.67:1**; warning on canvas **4.59:1**. Borders are structural, not text colors; use a separate visible focus ring for interactive controls.

## Typography

- Font stack: Inter, system UI, Segoe UI, sans-serif.
- Body: 14–16 px minimum for dense interfaces; 16 px default for long-form content.
- Body line height: 1.5–1.7.
- Page title: 32–48 px, weight 800–900, tight line height.
- Section title: 20–28 px, weight 700–800.
- Metadata: 12–13 px; never use low-contrast color to communicate critical information.

## Layout and spacing

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px.
- Content container: max width 1280 px with responsive horizontal gutters.
- Card radius: 20 px; form and navigation radius: 12 px; pill radius reserved for compact status labels.
- Use a consistent 1 px border and restrained shadow. Reserve dark surfaces for the manager shell and selected hero sections.

## Components and interaction

- **Buttons:** minimum 44 px height, sentence case, clear primary/secondary hierarchy, disabled state, visible focus ring.
- **Fields:** visible label, helpful hint where needed, inline validation, preserved input after errors, 46 px minimum height.
- **Cards:** one clear heading, concise supporting copy, and a single dominant action where possible.
- **Tables:** semantic headers, horizontally scrollable mobile wrapper, clear empty state, and search/filter controls when the dataset warrants them.
- **Status labels:** always include readable text; color is supplementary, never the only signal.
- **Navigation:** desktop public navigation, functional mobile disclosure menu, role-protected manager sidebar, active route state.
- **Feedback:** distinguish success, validation errors, access denial, loading, empty results, and server failures.

## Responsive behavior

- Mobile first; stack content and form fields by default.
- Two-column layouts begin at tablet/desktop breakpoints only when each column remains readable.
- Admin navigation collapses to a horizontally scrollable menu on narrow screens and a persistent sidebar on desktop.
- Tables remain readable through a dedicated overflow container rather than shrinking columns below usable widths.

## Accessibility

- Target WCAG 2.2 AA for text contrast (4.5:1 normal text, 3:1 large text and meaningful UI boundaries).
- Every input has a programmatic label; icon-only controls have accessible names and expanded state where relevant.
- Keyboard focus is visible and not obscured.
- Respect prefers-reduced-motion.
- Do not rely on color alone for success, warning, error, or status.
- Verify layouts at 200% zoom and with keyboard-only navigation before production release.

## Governance

- Add new styles as semantic tokens or reusable component patterns; avoid one-off arbitrary values where a token exists.
- Keep role checks and data access in server-side code. A visual component must never be treated as an authorization boundary.
- Do not use hardcoded KPI values or demo records in production views.
- Update this document when tokens or shared component behavior changes.
