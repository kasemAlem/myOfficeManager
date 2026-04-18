# src/app/dashboard/ — Authenticated Dashboard Pages

## Layout

`layout.tsx` provides the shell: sticky sidebar (280px) + scrollable main content area.
- Sidebar collapses to hamburger menu below 768px
- Navigation links are role-filtered (EMPLOYEE sees fewer items)
- Theme selector is in the sidebar for all users

## Pages

| Route | File | Description |
|-------|------|-------------|
| `/dashboard` | `page.tsx` | Project pipeline — status board with search, filters, create |
| `/dashboard/projects/[id]` | `projects/[id]/page.tsx` | Project detail — 6 tabs (Overview, Contacts, Financial, Timeline, Artifacts, Team Effort) |
| `/dashboard/financials` | `financials/page.tsx` | Revenue dashboard — charts, expense log, targets, ledger |
| `/dashboard/timesheets` | `timesheets/page.tsx` | Monthly calendar grid — hours entry by category, submission workflow |
| `/dashboard/team` | `team/page.tsx` | User management — create users, assign roles, reset passwords |
| `/dashboard/settings` | `settings/page.tsx` | App config — default theme, pipeline phases, activity feed toggle |
| `/dashboard/archive` | `archive/page.tsx` | Completed projects — read-only view |

## Page Pattern

All pages follow the same structure:

```tsx
'use client';
import { useState, useEffect } from 'react';
import { Toast, useToast } from '@/components/Toast';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function PageName() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast, toasts } = useToast();

  useEffect(() => {
    fetch('/api/resource')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => showToast('Failed to load data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton variant="page" />;
  if (!data?.length) return <EmptyState title="No items yet" action="Create one" />;

  return (
    <ErrorBoundary>
      <main>
        {/* page content */}
        <Toast toasts={toasts} />
      </main>
    </ErrorBoundary>
  );
}
```

## Styling Rules

- All colors: CSS variables only (`var(--accent-primary)`, `var(--bg-surface)`, etc.)
- Cards: `glass-panel` class
- Layout: responsive grids using CSS Grid or Flexbox
- Icons: Lucide React
- Spacing: Tailwind utilities or CSS custom properties
- Themes: all 4 themes must look correct (dark, light, green, system)

## Shared Components

Located in `src/components/`:

| Component | Use for |
|-----------|---------|
| `Toast` | Success/error/info feedback |
| `Modal` | Dialogs and forms |
| `ConfirmDialog` | Destructive action confirmation |
| `Skeleton` | Loading placeholders |
| `EmptyState` | No-data views with CTA |
| `Spinner` | Inline loading indicators |
| `ThemeSelector` | Theme picker (all users) |
| `ErrorBoundary` | Catch and display React errors |

## Accessibility

- Modals: focus trap, ESC to close, ARIA attributes
- Tabs: `role="tablist"`, keyboard arrow navigation
- Forms: `<label>` elements, required indicators, validation messages
- Semantic HTML: `<main>`, `<nav>`, `<section>`
- Skip link: "Skip to main content" in layout
