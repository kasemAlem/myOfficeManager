# 🗄️ Database Backup & Restore Guide

This document provides step-by-step instructions for backing up and restoring the application database.

---

## Table of Contents

1. [Quick Reference (Commands)](#quick-reference)
2. [How Backup Works](#how-backup-works)
3. [Step-by-Step: Run a Backup](#step-by-step-run-a-backup)
4. [Step-by-Step: Restore from Backup](#step-by-step-restore-from-backup)
5. [Scheduled (Automatic) Backups](#scheduled-automatic-backups)
6. [Google Drive Setup (Optional)](#google-drive-setup-optional)
7. [Environment Variables Reference](#environment-variables-reference)
8. [Troubleshooting](#troubleshooting)

---

## Quick Reference

| Action | Command |
|---|---|
| Run a backup now | `npm run backup` |
| Start scheduled backups | `npm run backup:schedule` |
| Restore from latest backup | `npm run restore` |
| Restore a specific file | `node scripts/restore.js backup_20260417_120000.sql.gz` |
| List available backups | `npm run restore:list` |

---

## How Backup Works

The backup system uses a **rotate-before-write** safety pattern:

```
┌─────────────────────────────────────────────────┐
│  Step 1: Rename current backup → *.old          │
│  Step 2: Run pg_dump → create new backup        │
│  Step 3: If success → delete *.old files        │
│  Step 4: Upload to Google Drive (if configured)  │
└─────────────────────────────────────────────────┘
```

**Why?** If the new backup fails mid-write, the `.old` file is still intact. You always have at least one valid backup at any point in time.

Backups are compressed `.sql.gz` files stored in the `BACKUP_DIR` directory (default: `./backups`).

---

## Step-by-Step: Run a Backup

### Prerequisites
- PostgreSQL must be running and accessible via `DATABASE_URL`
- `postgresql-client` must be installed (included in Docker image)

### Steps

1. **Open your terminal** and navigate to the project root:
   ```bash
   cd /path/to/myOfficeManager
   ```

2. **Run the backup command:**
   ```bash
   npm run backup
   ```

3. **Verify the output.** You should see:
   ```
   ══════════════════════════════════════════
     🗄️   DATABASE BACKUP — Starting
     📅  2026-04-17T08:00:00.000Z
   ══════════════════════════════════════════

   Step 1/4: Rotating existing backups...
   Step 2/4: Running pg_dump → backup_20260417_080000.sql.gz ...
   ✅  Backup created: backup_20260417_080000.sql.gz (0.15 MB)
   Step 3/4: Cleaning up old rotated backups...
   Step 4/4: Google Drive sync...

   🎉  Backup complete in 2.3s
   📦  File: ./backups/backup_20260417_080000.sql.gz
   ```

4. **Check the backup exists:**
   ```bash
   npm run restore:list
   ```

### Inside Docker

If running inside Docker Compose:
```bash
docker exec -it archfirm-app node scripts/backup.js
```

---

## Step-by-Step: Restore from Backup

> ⚠️ **WARNING:** Restoring a backup **replaces all current data** in the database. This action cannot be undone.

### Steps

1. **List available backups:**
   ```bash
   npm run restore:list
   ```

   Output:
   ```
   ══════════════════════════════════════════
     📋  Available Backups
   ══════════════════════════════════════════

     backup_20260417_080000.sql.gz  (0.15 MB, 4/17/2026, 8:00:00 AM) ← latest

     Total: 1 backup(s) in ./backups
   ```

2. **Restore the latest backup:**
   ```bash
   npm run restore
   ```

   Or **restore a specific file:**
   ```bash
   node scripts/restore.js backup_20260417_080000.sql.gz
   ```

3. **Confirm the operation** when prompted:
   ```
   ══════════════════════════════════════════
     ⚠️   DATABASE RESTORE
   ══════════════════════════════════════════

     File:     backup_20260417_080000.sql.gz
     Size:     0.15 MB
     Modified: 4/17/2026, 8:00:00 AM
     Target:   postgresql://postgres:****@localhost:5432/archfirm

   ⚠️   This will DROP all current data and replace it. Continue? (yes/no):
   ```

   Type `yes` and press Enter.

4. **Verify the restore** by opening the application and checking your data.

### Inside Docker

```bash
docker exec -it archfirm-app node scripts/restore.js
```

---

## Scheduled (Automatic) Backups

To run backups automatically on a schedule:

1. **Set your cron schedule** in `.env`:
   ```env
   BACKUP_CRON_SCHEDULE="0 0 * * *"   # Daily at midnight
   ```

   Common schedules:
   | Schedule | Cron Expression |
   |---|---|
   | Every hour | `0 * * * *` |
   | Daily at midnight | `0 0 * * *` |
   | Every 6 hours | `0 */6 * * *` |
   | Weekly (Sunday midnight) | `0 0 * * 0` |

2. **Start the scheduler:**
   ```bash
   npm run backup:schedule
   ```

3. **For Docker**, add it as a separate service or start it alongside your app. Example addition to `docker-compose.yml`:
   ```yaml
   backup:
     build:
       context: .
       dockerfile: Dockerfile
     container_name: archfirm-backup
     restart: always
     depends_on:
       - db
     environment:
       - DATABASE_URL=postgresql://postgres:password123@db:5432/archfirm?schema=public
     volumes:
       - ./.env:/app/.env
       - ./backups:/app/backups
     command: ["node", "scripts/backup.js", "--schedule"]
   ```

---

## Google Drive Setup (Optional)

To automatically upload backups to Google Drive:

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **Google Drive API**:
   - Go to **APIs & Services → Library**
   - Search for "Google Drive API"
   - Click **Enable**

### Step 2: Create a Service Account

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → Service Account**
3. Give it a name (e.g., `officemanager-backup`)
4. Click **Done**
5. Click on the new service account → **Keys** tab
6. **Add Key → Create new key → JSON**
7. Download the JSON file and save it in your project root (e.g., `gcp_service_account.json`)

### Step 3: Share your Drive Folder

1. Open Google Drive and create a folder for backups
2. Right-click the folder → **Share**
3. Paste the **service account email** (found in the JSON file as `client_email`)
4. Give it **Editor** access

### Step 4: Get the Folder ID

The folder ID is in the URL when you open the folder:
```
https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ
                                        └────── This is the ID ──────┘
```

### Step 5: Configure `.env`

```env
GOOGLE_DRIVE_FOLDER_ID="1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
GOOGLE_APPLICATION_CREDENTIALS="./gcp_service_account.json"
```

### Step 6: Test it

```bash
npm run backup
```

You should see:
```
☁️   Uploading to Google Drive folder: 1aBcDeFgHiJkLmNoPqRsTuVwXyZ ...
✅  Uploaded to Google Drive: backup_20260417_080000.sql.gz (ID: xyz123)
```

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `BACKUP_DIR` | `./backups` | Local directory to store backup files |
| `BACKUP_CRON_SCHEDULE` | `0 0 * * *` | Cron expression for automatic backups |
| `GOOGLE_DRIVE_FOLDER_ID` | *(empty)* | Google Drive folder ID for cloud uploads |
| `GOOGLE_APPLICATION_CREDENTIALS` | *(empty)* | Path to GCP Service Account JSON key file |

---

## Troubleshooting

### "pg_dump: command not found"
Install PostgreSQL client tools:
```bash
# Alpine Linux (Docker)
apk add --no-cache postgresql-client

# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install libpq && brew link --force libpq
```

### "connection refused" or "could not connect"
- Make sure PostgreSQL is running
- Verify `DATABASE_URL` in `.env` is correct
- If using Docker, make sure you're connecting to the right hostname (`db` inside docker-compose, `localhost` outside)

### "permission denied" on backup directory
```bash
mkdir -p ./backups
chmod 755 ./backups
```

### Google Drive upload fails
- Verify the service account email has **Editor** access to the Drive folder
- Check that the JSON credentials file path is correct
- Make sure the Google Drive API is enabled in your GCP project
