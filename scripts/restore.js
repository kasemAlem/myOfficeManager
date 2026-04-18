#!/usr/bin/env node

/**
 * Database Restore Script
 * ───────────────────────
 * Restores a PostgreSQL database from a .sql.gz backup file.
 *
 * Usage:
 *   node scripts/restore.js                              # Restores latest local backup
 *   node scripts/restore.js backup_20260417_120000.sql.gz # Restores a specific file
 *   node scripts/restore.js --list                       # Lists available backups
 *
 * ⚠️  WARNING: This DROPS all existing data and replaces it with the backup.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ── Load env ──────────────────────────────────────────────────────────
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = path.resolve(process.env.BACKUP_DIR || './backups');

if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL is not set. Aborting restore.');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────

function getBackupFiles() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql.gz') && !f.endsWith('.old'))
    .sort()
    .reverse();
}

function formatFileInfo(file) {
  const filePath = path.join(BACKUP_DIR, file);
  const stats = fs.statSync(filePath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  const date = stats.mtime.toLocaleString();
  return `  ${file}  (${sizeMB} MB, ${date})`;
}

function confirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

// ── List Available Backups ────────────────────────────────────────────

function listBackups() {
  const files = getBackupFiles();
  if (files.length === 0) {
    console.log(`\n📁  No backups found in: ${BACKUP_DIR}\n`);
    return;
  }

  console.log('\n══════════════════════════════════════════');
  console.log('  📋  Available Backups');
  console.log('══════════════════════════════════════════\n');
  files.forEach((file, i) => {
    const marker = i === 0 ? ' ← latest' : '';
    console.log(`${formatFileInfo(file)}${marker}`);
  });
  console.log(`\n  Total: ${files.length} backup(s) in ${BACKUP_DIR}\n`);
}

// ── Restore Logic ─────────────────────────────────────────────────────

async function performRestore(targetFile) {
  // Resolve the backup file to use
  let backupPath;

  if (targetFile) {
    // Check if user passed a full path or just a filename
    if (path.isAbsolute(targetFile)) {
      backupPath = targetFile;
    } else {
      backupPath = path.join(BACKUP_DIR, targetFile);
    }
  } else {
    // Default: pick the latest backup
    const files = getBackupFiles();
    if (files.length === 0) {
      console.error(`❌  No backup files found in: ${BACKUP_DIR}`);
      console.error('    Run "node scripts/backup.js" first to create one.');
      process.exit(1);
    }
    backupPath = path.join(BACKUP_DIR, files[0]);
    console.log(`📦  No file specified. Using latest: ${files[0]}`);
  }

  if (!fs.existsSync(backupPath)) {
    console.error(`❌  Backup file not found: ${backupPath}`);
    process.exit(1);
  }

  const stats = fs.statSync(backupPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n══════════════════════════════════════════');
  console.log('  ⚠️   DATABASE RESTORE');
  console.log('══════════════════════════════════════════\n');
  console.log(`  File:     ${path.basename(backupPath)}`);
  console.log(`  Size:     ${sizeMB} MB`);
  console.log(`  Modified: ${stats.mtime.toLocaleString()}`);
  console.log(`  Target:   ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
  console.log('');

  // Safety confirmation
  const answer = await confirm('⚠️   This will DROP all current data and replace it. Continue? (yes/no): ');
  if (answer !== 'yes' && answer !== 'y') {
    console.log('\n🛑  Restore cancelled.\n');
    process.exit(0);
  }

  console.log('\n🔧  Restoring database...');

  try {
    // Drop and recreate via psql to handle the plain SQL dump
    execSync(`gunzip -c "${backupPath}" | psql "${DATABASE_URL}"`, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 300000, // 5 min timeout
    });

    console.log('✅  Database restored successfully!');
    console.log(`📦  From: ${path.basename(backupPath)}\n`);
  } catch (err) {
    console.error('❌  Restore failed:', err.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Make sure PostgreSQL is running and DATABASE_URL is correct.');
    console.error('  2. Make sure pg_dump/psql are installed (postgresql-client).');
    console.error('  3. Check that the backup file is not corrupted.\n');
    process.exit(1);
  }
}

// ── Entrypoint ────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--list') || args.includes('-l')) {
  listBackups();
} else {
  const target = args.find(a => !a.startsWith('-')) || null;
  performRestore(target).catch(err => { console.error(err); process.exit(1); });
}
