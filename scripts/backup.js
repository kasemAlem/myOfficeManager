#!/usr/bin/env node

/**
 * Database Backup Script
 * ──────────────────────
 * Performs a full PostgreSQL dump with safe rotate-before-write:
 *   1. Renames any existing backup → *.old
 *   2. Runs pg_dump → fresh backup
 *   3. On success → deletes *.old
 *   4. Optionally uploads to Google Drive
 *
 * Usage:
 *   node scripts/backup.js              # One-shot backup
 *   node scripts/backup.js --schedule   # Run on cron schedule
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Load env ──────────────────────────────────────────────────────────
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = path.resolve(process.env.BACKUP_DIR || './backups');
const CRON_SCHEDULE = process.env.BACKUP_CRON_SCHEDULE || '0 0 * * *';
const GDRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
const GCP_CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';

if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL is not set. Aborting backup.');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁  Created backup directory: ${dir}`);
  }
}

function timestamp() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
    '_',
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
    String(d.getSeconds()).padStart(2, '0'),
  ].join('');
}

/**
 * Rotate existing backups:
 * Find the most recent .sql.gz file and rename it to .sql.gz.old
 */
function rotateExisting(dir) {
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql.gz') && !f.endsWith('.old'))
    .sort()
    .reverse();

  for (const file of files) {
    const src = path.join(dir, file);
    const dst = path.join(dir, file + '.old');
    fs.renameSync(src, dst);
    console.log(`🔄  Rotated: ${file} → ${file}.old`);
  }
}

/**
 * Delete all .old backup files (called only after new backup succeeds)
 */
function cleanupOld(dir) {
  const oldFiles = fs.readdirSync(dir).filter(f => f.endsWith('.old'));
  for (const file of oldFiles) {
    fs.unlinkSync(path.join(dir, file));
    console.log(`🗑️   Cleaned up: ${file}`);
  }
}

/**
 * Upload a file to Google Drive using a Service Account
 */
async function uploadToGoogleDrive(filePath) {
  if (!GDRIVE_FOLDER_ID) return;

  if (!GCP_CREDENTIALS_PATH || !fs.existsSync(GCP_CREDENTIALS_PATH)) {
    console.warn('⚠️   GOOGLE_DRIVE_FOLDER_ID is set but GOOGLE_APPLICATION_CREDENTIALS is missing or invalid. Skipping Drive upload.');
    return;
  }

  try {
    const { google } = require('googleapis');
    const auth = new google.auth.GoogleAuth({
      keyFile: GCP_CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const fileName = path.basename(filePath);

    console.log(`☁️   Uploading to Google Drive folder: ${GDRIVE_FOLDER_ID} ...`);

    const res = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [GDRIVE_FOLDER_ID],
      },
      media: {
        mimeType: 'application/gzip',
        body: fs.createReadStream(filePath),
      },
      fields: 'id, name, size',
    });

    console.log(`✅  Uploaded to Google Drive: ${res.data.name} (ID: ${res.data.id})`);
  } catch (err) {
    console.error('❌  Google Drive upload failed:', err.message);
    // Non-fatal — local backup still exists
  }
}

// ── Main Backup Logic ─────────────────────────────────────────────────

async function performBackup() {
  const startTime = Date.now();
  console.log('\n══════════════════════════════════════════');
  console.log('  🗄️   DATABASE BACKUP — Starting');
  console.log(`  📅  ${new Date().toISOString()}`);
  console.log('══════════════════════════════════════════\n');

  ensureDir(BACKUP_DIR);

  // Step 1: Rotate existing backups → .old
  console.log('Step 1/4: Rotating existing backups...');
  rotateExisting(BACKUP_DIR);

  // Step 2: Run pg_dump
  const backupFile = path.join(BACKUP_DIR, `backup_${timestamp()}.sql.gz`);
  console.log(`Step 2/4: Running pg_dump → ${path.basename(backupFile)} ...`);

  try {
    execSync(`pg_dump "${DATABASE_URL}" | gzip > "${backupFile}"`, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120000, // 2 min timeout
    });

    const stats = fs.statSync(backupFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅  Backup created: ${path.basename(backupFile)} (${sizeMB} MB)`);
  } catch (err) {
    console.error('❌  pg_dump failed:', err.message);
    console.error('⚠️   Keeping .old backups intact for safety.');
    process.exit(1);
  }

  // Step 3: Cleanup .old files (only after successful dump)
  console.log('Step 3/4: Cleaning up old rotated backups...');
  cleanupOld(BACKUP_DIR);

  // Step 4: Upload to Google Drive (optional)
  console.log('Step 4/4: Google Drive sync...');
  await uploadToGoogleDrive(backupFile);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉  Backup complete in ${elapsed}s`);
  console.log(`📦  File: ${backupFile}\n`);
}

// ── Entrypoint ────────────────────────────────────────────────────────

if (process.argv.includes('--schedule')) {
  const cron = require('node-cron');
  console.log(`⏰  Backup scheduler started. Schedule: "${CRON_SCHEDULE}"`);
  console.log(`📁  Backup directory: ${BACKUP_DIR}`);
  console.log(`☁️   Google Drive: ${GDRIVE_FOLDER_ID ? 'Enabled' : 'Disabled'}\n`);

  cron.schedule(CRON_SCHEDULE, () => {
    performBackup().catch(err => console.error('Scheduled backup error:', err));
  });

  // Keep the process alive
  process.on('SIGINT', () => { console.log('\n🛑  Backup scheduler stopped.'); process.exit(0); });
  process.on('SIGTERM', () => { console.log('\n🛑  Backup scheduler stopped.'); process.exit(0); });
} else {
  performBackup().catch(err => { console.error(err); process.exit(1); });
}
