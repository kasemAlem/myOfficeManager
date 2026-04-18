@AGENTS.md

# myOfficeManager — Development Guide

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, standalone output) | 16.2.2 |
| Language | TypeScript (strict mode) | 5 |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS + CSS custom properties | 4 |
| ORM | Prisma | 6.19 |
| Database | PostgreSQL | 15 |
| Auth | JWT via `jose` + `bcrypt` password hashing | — |
| Charts | Recharts | 3.8 |
| Icons | Lucide React | — |
| Email | Nodemailer | 8 |
| Drag & Drop | @dnd-kit | — |
| Export | xlsx | — |
| Scheduling | node-cron | — |

## Directory Structure

```
src/
├── app/
│   ├── api/              # RESTful API routes (auth, projects, team, timesheets, financials, etc.)
│   ├── dashboard/        # Authenticated pages (pipeline, financials, timesheets, team, settings, archive)
│   ├── login/            # Public login page
│   ├── forgot-password/  # Public password reset request
│   ├── reset-password/   # Public password reset form
│   ├── layout.tsx        # Root layout — applies theme from theme-config.json
│   ├── page.tsx          # Redirects to /dashboard
│   └── globals.css       # CSS variables, theme definitions, utility classes
├── components/           # Shared reusable components (Toast, Modal, Skeleton, etc.)
├── lib/
│   ├── prisma.ts         # Prisma client singleton
│   ├── auth.ts           # JWT sign/verify, session get/set/clear
│   ├── audit.ts          # Audit logging helper
│   └── mail.ts           # Nodemailer transporter + email templates
prisma/
├── schema.prisma         # 13 models, PostgreSQL, UUID primary keys
├── migrations/           # Prisma migration history
scripts/
├── deploy.sh             # Automated deployment pipeline
├── backup.js             # Database backup (local + Google Drive)
├── restore.js            # Database restore
├── seed_admin.js         # Create initial admin user from .env
├── seed_projects.js      # Populate test data
├── reset_deploy.js       # Clean-slate DB reset + admin seed
```

## Development Commands

```bash
npm run dev              # Start dev server (http://localhost:3007)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint
npm run db:clean         # WARNING: Force-reset DB + seed admin
npm run db:migrate       # Deploy pending Prisma migrations
npm run backup           # Create database backup
npm run backup:schedule  # Start scheduled backup daemon
npm run restore          # Restore from backup
npm run restore:list     # List available backups
npm run deploy           # Full deployment pipeline
```

## Environment Setup

1. Copy `.env.example` to `.env` and fill in values
2. Start PostgreSQL (or `docker-compose up db -d`)
3. Run `npx prisma migrate deploy` to apply schema
4. Run `node scripts/seed_admin.js` to create the first admin user
5. Run `npm run dev`

Key env vars: `DATABASE_URL`, `JWT_SECRET`, `INITIAL_ADMIN_EMAIL/PASSWORD`, `SMTP_*`, `NEXT_PUBLIC_CURRENCY_SYMBOL`, `NEXT_PUBLIC_COMPANY_NAME`

## Coding Conventions

### Pages
- All dashboard pages are client components (`"use client"`)
- Data fetching via `useEffect` + `fetch()` to API routes
- No global state library — React hooks only
- Use shared components from `src/components/` (Toast, Modal, Skeleton, etc.)

### Styling
- **Never hardcode colors** — always use CSS variables (`var(--accent-primary)`, `var(--bg-surface)`, etc.)
- Glass-morphism aesthetic: `glass-panel` class for cards
- Lucide React for all icons
- Responsive: mobile-first with breakpoints at 480px, 768px, 1024px
- 4 themes: dark (default), light, green, system — all defined in `globals.css`

### API Routes
- File: `src/app/api/{resource}/route.ts`
- Always call `getSession()` first for protected routes
- Check `session.role` for authorization (ADMIN, MANAGER, EMPLOYEE)
- Response format: `{ data: T }` on success, `{ error: string }` on failure
- Call `recordAuditLog()` for data mutations
- Validate input with Zod schemas from `src/lib/validation.ts`

### Database
- Prisma singleton from `src/lib/prisma.ts` — never instantiate PrismaClient directly
- UUID primary keys on all models
- Cascade deletes on child relations
- After schema changes: `npx prisma migrate dev --name description`

### Generalization
- The app is business-agnostic — no industry-specific terms in UI
- Currency, locale, categories are configured via environment variables
- Dynamic phases stored in `phases-config.json` (not DB)
- Theme config stored in `theme-config.json` (not DB)

## Role-Based Access

| Feature | ADMIN | MANAGER | EMPLOYEE |
|---------|-------|---------|----------|
| Projects (CRUD) | Yes | Yes | Yes |
| Financials | Yes | Yes | Read-only |
| Team management | Yes | Yes (limited) | No |
| Settings | Yes | Yes | No |
| Timesheets | All users | All users | Own only |
| Audit log | Yes | Yes | No |
| Theme selection | Yes | Yes | Yes |
