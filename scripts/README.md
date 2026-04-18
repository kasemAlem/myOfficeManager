# scripts/ — Operations & Deployment

## Deployment

### deploy.sh — Automated Deployment Pipeline

Runs 5 steps in sequence:
1. **Snapshot** — Pre-deployment database backup
2. **Pull** — `git pull origin main`
3. **Build** — `docker-compose build` or `npm run build`
4. **Migrate** — `npx prisma migrate deploy`
5. **Verify** — Health check to `http://localhost:3007/api/health`

```bash
npm run deploy
# or
bash scripts/deploy.sh
```

Logs output to `backups/deploy.log`. If any step fails, the pipeline stops and prints rollback guidance.

### reset_deploy.js — Clean-Slate Database

Purges all tables and creates the initial admin user from environment variables. **Destructive — use only for first-time setup.**

```bash
npm run db:clean
```

## Backup & Restore

### backup.js — Database Backup

Creates PostgreSQL dump files in the configured backup directory.

```bash
# One-time backup
npm run backup

# Start scheduled backups (uses BACKUP_CRON_SCHEDULE from .env)
npm run backup:schedule
```

Supports optional Google Drive upload when `GOOGLE_DRIVE_FOLDER_ID` and `GOOGLE_APPLICATION_CREDENTIALS` are set.

See `BACKUP_RESTORE.md` in the project root for full setup instructions.

### restore.js — Database Restore

```bash
# List available backups
npm run restore:list

# Restore from a backup file
npm run restore
```

## Seeding

### seed_admin.js

Creates the initial admin user from env vars:
- `INITIAL_ADMIN_EMAIL`
- `INITIAL_ADMIN_PASSWORD`
- `INITIAL_ADMIN_NAME`

Run automatically by `npm run db:clean`, or standalone:
```bash
node scripts/seed_admin.js
```

### seed_projects.js

Populates the database with sample project data for development/testing:
```bash
node scripts/seed_projects.js
```

## Other

### debug_audit.js

Diagnostic script for inspecting audit log entries. Development use only.
