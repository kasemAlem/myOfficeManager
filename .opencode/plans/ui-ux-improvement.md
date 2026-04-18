# UI/UX Improvement Plan

## Overview
Modernize the Management OS dashboard with consistent component usage, better state management, visual polish, responsive design, and accessibility improvements.

---

## Execution Order (9 Steps)

### Step 1: Toast Context (P2.7)
**Eliminate `useToast()` / `<ToastContainer>` boilerplate from every page**

- Create `src/components/ToastProvider.tsx` — wraps children in React Context
- Provides `showToast`, `dismissToast`, `toasts` globally via `useToastContext()`
- `<ToastContainer>` renders once inside the provider
- Update `src/app/dashboard/layout.tsx` to wrap with `<ToastProvider>`
- Remove `const { toasts, showToast, dismissToast } = useToast()` + `<ToastContainer>` from all 7 pages

**Files affected:** `Toast.tsx`, `dashboard/layout.tsx`, all 7 dashboard pages

---

### Step 2: Custom Hooks (P2.8)
**Create reusable hooks to eliminate boilerplate fetch/state logic**

- **`useApi<T>`** — generic fetch wrapper returning `{ data, loading, error, execute, reset }`
  - Handles loading/error states, AbortController cleanup, JSON parsing
- **`useForm<T>`** — form state management
  - Manages field values, errors, touched, dirty state
  - Optional Zod schema validation
  - `handleSubmit`, `handleChange`, `setFieldValue`, `reset`
- **`useMediaQuery(query)`** — reactive media query matching
- **`useLocalStorage<T>(key, default)`** — persistent state with SSR safety

**New files:** `src/lib/hooks/useApi.ts`, `src/lib/hooks/useForm.ts`, `src/lib/hooks/useMediaQuery.ts`, `src/lib/hooks/useLocalStorage.ts`, `src/lib/hooks/index.ts`

---

### Step 3: Zod Client Integration (P2.9)
**Connect existing `validation.ts` schemas to the client**

- Import Zod schemas from `validation.ts` into page components
- Pass schemas to `useForm<T>` for type-safe validation
- Display field errors via `<FormField>` (created in Step 5) or `<Input error={...}>`
- Remove manual `errorMSG` state variables (`team/page.tsx:18`, `dashboard/page.tsx:37`, etc.)

**Files affected:** `validation.ts`, all 7 dashboard pages

---

### Step 4: Replace Inline Elements with Components (P1.1-6)
**Every page uses shared components instead of raw DOM elements**

| Component | Replaces | Instances | Pages |
|-----------|----------|-----------|-------|
| `<Button>` | inline `<button>` with raw styles | ~30 | dashboard, team, financials, timesheets, settings, project detail |
| `<Input>` | inline `<input>` with raw styles | ~15 | dashboard, team, financials, timesheets, settings, project detail |
| `<Select>` | inline `<select>` with raw styles | ~8 | dashboard, team, financials, timesheets, settings, project detail |
| `<Card>` | inline `glass-panel` / styled divs | ~15 | all pages |
| `<Badge>` | inline status badge divs | ~6 | dashboard, project detail, financials |
| `<Table>` | manual table divs | ~4 | dashboard, team, timesheets, archive |

**Key style normalization:** Every component receives the same CSS variable-based styling. Inline `inputStyle` objects (declared 4 times across pages) are eliminated.

---

### Step 5: Decompose Project Detail Page + Create New Components (P3.11-14)

- **Split `projects/[id]/page.tsx` (1021 lines)** into:
  - `src/components/projects/ProjectOverview.tsx`
  - `src/components/projects/ProjectContacts.tsx`
  - `src/components/projects/ProjectFinancials.tsx`
  - `src/components/projects/ProjectTimeline.tsx`
  - `src/components/projects/ProjectArtifacts.tsx`
  - `src/components/projects/ProjectEffort.tsx`
  - `src/components/projects/index.ts`
  - Original page drops to ~100 lines — imports + tab routing

- **Create `<MetricCard>` component**
  - Props: `icon`, `value`, `label`, `color`, `trend`, `onClick`
  - Replaces the 3-card metric block in financials (~200 lines to ~10 lines)

- **Create `<ProgressBar>` component**
  - Props: `value`, `max`, `color`, `height`, `animated`, `label`
  - Replaces inline progress bars in dashboard + project detail

- **Create `<FormField>` component**
  - Props: `label`, `name`, `error`, `required`, `children`
  - Wraps label + control + error message into consistent layout
  - Works with `useForm` hook (connects errors via field name)

---

### Step 6: Visual Polish (P4.15-20)

- **Shared components:**
  - `Button.tsx`: Replace `rgba(16,185,129,0.3)` with `var(--accent-primary)`, radii with `var(--radius-*)`
  - `Modal.tsx`: Replace `rgba(0,0,0,0.6)` with new `var(--overlay-bg)` CSS var
  - `Badge.tsx`: Replace raw hex with CSS vars with opacity
  - `ErrorBoundary.tsx`: Replace `rgba(248,113,113,0.1)` with `var(--accent-danger)`
  - `EmptyState.tsx`: Replace `rgba(16,185,129,0.08)` with `var(--accent-primary)`
  - `Spinner.tsx`: Replace inline `animation` with CSS class reference

- **Globals:**
  - Add `--overlay-bg` CSS variable to both themes
  - Add `@media (prefers-reduced-motion: no-preference)` wrapper around all animations
  - Add `.btn-press { transform: scale(0.97) }` and `.card-hover { transform: scale(1.02) }`

- **Fix Toast mobile overflow:** `minWidth: 320px` to `minWidth: 300px; width: calc(100vw - 3rem)`

- **Standardize transitions:** Remove all inline `transition: 'all 0.2s ease'` etc. and apply `transition-standard` class

---

### Step 7: UX Flows (P5.21-25)

- **Keyboard tab navigation:** Add `onKeyDown` handler to all `role="tablist"` elements (financials, settings, project detail) with ArrowLeft/ArrowRight cycling

- **Skeleton sections:** Replace single `Skeleton variant="page"` with per-section skeletons:
  - Chart area: `<Skeleton variant="card" count={3} />`
  - Table area: `<Skeleton variant="row" count={5} />`

- **Optimistic UI updates:**
  - Project status dropdown: show new status immediately, revert on error
  - Toggle switches (settings): show new state immediately, revert on error
  - Inline edits (project name, contact info): show new value immediately, revert on error

- **Command palette (Cmd+K):**
  - Global search overlay triggered by `Cmd+K` / `Ctrl+K`
  - Searches across projects, team members, and navigation sections
  - Filter-as-you-type with keyboard navigation (arrows + Enter to navigate)
  - Uses `@dnd-kit` (already installed) or custom implementation

- **Keyboard shortcut hints:**
  - `⌘K` badge on search bar
  - `⌘N` on "Create Project" button
  - Tooltip on hover showing shortcuts

---

### Step 8: Mobile & Responsive (P6.26-28)

- **Scroll shadows:** CSS `background: linear-gradient(to right, transparent, ...)` on overflow-x tables
- **375px audit:** Check every page at 375px width; fix overflow, small touch targets, readability
  - Increase minimum touch target to 44px where needed
  - Ensure modals are fully usable on mobile
  - Verify sidebar hamburger menu works correctly
- **Swipe-to-dismiss toast:** Add touch event handlers to Toast for mobile swipe gesture

---

### Step 9: Accessibility (P7.29-32)

- **Modal focus trap fix** (`Modal.tsx`):
  - Add `[contenteditable]` and `a[href]` to focusable selector
  - Ensure close button is first focusable element
- **Table row keyboard a11y** (`Table.tsx`):
  - `tabIndex={0}` on rows with `onRowClick`
  - `onKeyDown` handler: Enter/Space to trigger click
- **Badge role="status"** (`Badge.tsx`):
  - Add `role="status"` and `aria-label` based on variant for semantic badges
- **Table loading state** (`Table.tsx`):
  - Add `loading` prop: renders skeleton rows when true

---

## File Change Summary

| Type | Count |
|------|-------|
| New files | ~15 |
| Modified files | ~25 |
| Deleted files | 0 |

## Estimated Timeline

| Step | Description | Est. Time |
|------|-------------|-----------|
| 1 | Toast Context | 1h |
| 2 | Custom Hooks | 2h |
| 3 | Zod Client Integration | 1h |
| 4 | Replace Inline Elements | 4h |
| 5 | Decompose Project Detail | 5h |
| 6 | Visual Polish | 3h |
| 7 | UX Flows | 6h |
| 8 | Mobile & Responsive | 3h |
| 9 | Accessibility | 1h |
| **Total** | | **~26h** |
