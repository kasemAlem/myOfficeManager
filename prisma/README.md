# prisma/ — Database Schema & Migrations

## Schema Overview

13 models defined in `schema.prisma`, PostgreSQL with UUID primary keys.

### Core Models

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| `User` | System users | email (unique), passwordHash, name, role (ADMIN/MANAGER/EMPLOYEE) |
| `Project` | Managed projects | name, totalFees, clientName, status (dynamic phase name), budget |
| `ProjectMilestone` | Phase/milestone tracking | name, feeAmount, isCompleted, dueDate, orderIndex |
| `ProjectPayment` | Payments received | amount, datePaid, createdById (FK → User) |
| `TimeLog` | Time entries | employeeId, projectId, category, hours, dateLogged |
| `BusinessExpense` | Business expenses | category, amount, date, vendor, isPaid |
| `FinancialTarget` | Annual revenue goals | year (unique), targetAmount |

### Supporting Models

| Model | Purpose |
|-------|---------|
| `DocumentLink` | File/URL references per project |
| `ProjectContact` | Contact people per project |
| `AuditLog` | Data mutation history |
| `TimesheetSubmission` | Monthly submission status per user |
| `PasswordResetToken` | Time-limited password reset tokens |

## Relationships

- `Project` → has many: Milestones, Payments, TimeLogs, Documents, Contacts
- `User` → has many: TimeLogs, Payments, Expenses, AuditLogs, Submissions
- All child relations cascade on delete

## Common Queries

```ts
// Balance due for a project
const balanceDue = project.totalFees - project.payments.reduce((sum, p) => sum + p.amount, 0);

// Archive condition
const isArchived = project.status === lastPhase && balanceDue <= 0;
```

## Migration Workflow

```bash
# Development: create a new migration
npx prisma migrate dev --name add_new_field

# Production: apply pending migrations
npx prisma migrate deploy
# or
npm run db:migrate

# First-time setup (destructive)
npm run db:clean
```

## Seeding

```bash
# Create initial admin (reads from .env)
node scripts/seed_admin.js

# Populate test data
node scripts/seed_projects.js
```

## Index Strategy

Indexes should be added on fields commonly used in WHERE/ORDER BY:
- `TimeLog`: employeeId, projectId, dateLogged
- `ProjectPayment`: datePaid
- `BusinessExpense`: date
- `AuditLog`: createdAt
