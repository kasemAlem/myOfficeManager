#!/bin/bash

# ==============================================================================
# SAFE DEPLOYMENT & UPGRADE ORCHESTRATOR
# ==============================================================================
# 1. Snapshot: Creates a full DB backup before touching anything.
# 2. Pull: Fetches latest code from origin (main).
# 3. Build: Rebuilds Docker containers and restarts services.
# 4. Migrate: Runs Prisma migrations against the live database.
# 5. Verify: Checks system health via /api/health.
# ==============================================================================

set -e

# Configuration
APP_CONTAINER_NAME="officemanager-app"
HEALTH_CHECK_URL="http://localhost:3007/api/health"
LOG_FILE="backups/deploy.log"

# Setup logging
mkdir -p backups
exec > >(tee -a "$LOG_FILE") 2>&1

echo "----------------------------------------------------------------"
echo "🚀 DEPLOYMENT STARTED: $(date)"
echo "----------------------------------------------------------------"

# Step 1: Pre-Deploy Backup
echo "Step 1/5: Creating pre-deployment database snapshot..."
npm run backup || { echo "❌ Backup failed! Aborting deployment for safety."; exit 1; }

# Step 2: Update Code
echo "Step 2/5: Pulling latest code..."
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    git pull origin main || echo "⚠️  Git pull failed or no upstream branch. Continuing with local state."
else
    echo "ℹ️  Not a git repository. Skipping code pull."
fi

# Step 3: Container Orchestration
echo "Step 3/5: Rebuilding and restarting containers..."
docker compose down
docker compose up -d --build

# Step 4: Database Migration
echo "Step 4/5: Running database migrations (non-destructive)..."
# Wait for DB to be initialized by Docker Healthcheck
echo "Waiting for container orchestration to stabilize..."

count=0
# On Windows/Bash, comparing health state might need extra care with return values
until [ "$(docker inspect -f {{.State.Health.Status}} $APP_CONTAINER_NAME 2>/dev/null)" == "healthy" ]; do
    echo -n "."
    sleep 2
    ((count++))
    if [ $count -gt 30 ]; then echo "❌ Timeout waiting for app. Check docker logs."; exit 1; fi
done
echo "Container is live. Executing migrations."
docker exec $APP_CONTAINER_NAME npm run db:migrate

# Step 5: Health Verification
echo "Step 5/5: Verifying overall system health..."
# Use -k to allow local/untrusted certs if necessary, though unlikely on localhost:3000
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL")

if [ "$STATUS_CODE" -eq 200 ]; then
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "🌎 URL: $HEALTH_CHECK_URL"
else
    echo "❌ HEALTH CHECK FAILED (Status: $STATUS_CODE). Check docker logs for $APP_CONTAINER_NAME."
    echo "⚠️  You may need to run 'npm run restore' if data was corrupted."
    exit 1
fi

echo "----------------------------------------------------------------"
echo "🏁 DEPLOYMENT FINISHED AT $(date)"
echo "----------------------------------------------------------------"
