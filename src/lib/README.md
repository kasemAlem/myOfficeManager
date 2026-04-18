# src/lib/ — Shared Utilities

## prisma.ts — Database Client

Singleton `PrismaClient` instance. Import and use directly:

```ts
import { prisma } from '@/lib/prisma';

const users = await prisma.user.findMany();
```

Never instantiate `new PrismaClient()` anywhere else. The singleton prevents connection pool exhaustion during hot-reload in development.

## auth.ts — Authentication & Sessions

JWT-based authentication using `jose` with HttpOnly cookies.

| Function | Purpose |
|----------|---------|
| `signToken(payload)` | Create a signed JWT (HS256, 24h expiry) |
| `verifyToken(token)` | Verify and decode a JWT, returns `null` on failure |
| `getSession()` | Read the `auth_token` cookie and verify it. Returns `{ userId, role }` or `null` |
| `setSession(userId, role)` | Sign a JWT and set it as an HttpOnly cookie |
| `clearSession()` | Delete the `auth_token` cookie |

**Usage in API routes:**
```ts
const session = await getSession();
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
// session.userId, session.role are available
```

**Roles:** `ADMIN`, `MANAGER`, `EMPLOYEE`

## audit.ts — Audit Logging

Records data mutations for compliance and activity feeds.

```ts
import { recordAuditLog } from '@/lib/audit';

await recordAuditLog({
  action: 'PROJECT_CREATED',
  entity: 'Project',
  entityId: project.id,
  details: `Created project: ${project.name}`,
  userId: session.userId,
});
```

**Available actions:** `PROJECT_CREATED`, `PROJECT_UPDATED`, `PROJECT_DELETED`, `PAYMENT_RECORDED`, `EXPENSE_RECORDED`, `MILESTONE_UPDATED`, `STAFF_ADDED`

**Available entities:** `Project`, `ProjectPayment`, `BusinessExpense`, `ProjectMilestone`, `User`

## mail.ts — Email

Nodemailer transporter configured from `SMTP_*` environment variables.

| Function | Purpose |
|----------|---------|
| `sendPasswordResetEmail(to, resetUrl)` | Send password reset email with branded HTML template |

Branding pulled from `NEXT_PUBLIC_APP_NAME` and `NEXT_PUBLIC_COMPANY_NAME` env vars.
