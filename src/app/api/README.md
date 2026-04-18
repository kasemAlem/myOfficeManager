# src/app/api/ — REST API Routes

## Route Structure

Each resource has a `route.ts` exporting HTTP method handlers:

```
api/
├── auth/
│   ├── login/route.ts          POST   — Authenticate user
│   ├── register/route.ts       POST   — Create user (admin only)
│   ├── logout/route.ts         POST   — Clear session
│   ├── me/route.ts             GET    — Current user info
│   ├── forgot-password/route.ts POST  — Send reset email
│   └── reset-password/route.ts  POST  — Complete reset
├── projects/
│   ├── route.ts                GET/POST — List/create projects
│   └── [id]/
│       ├── route.ts            GET/PUT/DELETE — Read/update/delete project
│       ├── contacts/route.ts   GET/POST — Project contacts
│       ├── documents/route.ts  GET/POST — Document links
│       ├── milestones/route.ts GET/POST — Project milestones
│       └── payments/route.ts   GET/POST — Project payments
├── team/route.ts               GET/POST/PATCH/DELETE — User management
├── timesheets/
│   ├── route.ts                GET/POST — Time logs
│   ├── submit/route.ts         GET/POST — Submission status
│   └── report/route.ts         GET — XLSX export
├── financials/route.ts         GET/POST — Revenue/expenses
├── audit/route.ts              GET — Audit log entries
├── theme/route.ts              GET/POST — Theme config
├── phases/route.ts             GET/POST — Pipeline phases
└── health/route.ts             GET — Health check
```

## Auth Pattern

Every protected route must start with:

```ts
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // For restricted routes, check role:
  if (!['ADMIN', 'MANAGER'].includes(session.role as string)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ... handle request
}
```

## Response Format

```ts
// Success
NextResponse.json({ data: result })

// Error
NextResponse.json({ error: 'Human-readable message' }, { status: 4xx })
```

Never expose `error.message` from caught exceptions in production.

## Role Access Matrix

| Endpoint | ADMIN | MANAGER | EMPLOYEE |
|----------|-------|---------|----------|
| `/api/projects` | Full CRUD | Full CRUD | Full CRUD |
| `/api/team` | Full CRUD | Read + Update | No access |
| `/api/financials` | Full CRUD | Full CRUD | Read only |
| `/api/timesheets` | All users | All users | Own only |
| `/api/audit` | Read | Read | No access |
| `/api/theme` | Read/Write | Read/Write | Read only |
| `/api/phases` | Read/Write | Read/Write | Read only |
| `/api/auth/register` | Create users | No access | No access |

## Adding a New Endpoint

1. Create `src/app/api/{resource}/route.ts`
2. Add auth check via `getSession()`
3. Validate input with Zod schema from `src/lib/validation.ts`
4. Use `prisma` from `@/lib/prisma` for DB operations
5. Call `recordAuditLog()` for data mutations
6. Return consistent response format
