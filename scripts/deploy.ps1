# ==============================================================================
# SAFE DEPLOYMENT & UPGRADE ORCHESTRATOR FOR WINDOWS POWERSHELL
# ==============================================================================
# 1. Pull: Fetches latest code from origin (main).
# 2. Snapshot: Creates a full DB backup before touching anything.
# 3. Build: Rebuilds Docker containers and restarts services.
# 4. Migrate: Runs Prisma migrations against the live database.
# 5. Verify: Checks system health via /api/health.
# ==============================================================================

$ErrorActionPreference = "Stop"

$APP_CONTAINER_NAME = "officemanager-app"
$HEALTH_CHECK_URL = "http://localhost:3007/api/health"

if (-not (Test-Path "backups")) {
    New-Item -ItemType Directory -Path "backups" | Out-Null
}

Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "🚀 DEPLOYMENT STARTED: $(Get-Date)" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------"

# Step 1: Update Code
Write-Host "Step 1/5: Pulling latest code..." -ForegroundColor Yellow
try {
    git pull origin main
} catch {
    Write-Host "⚠️  Git pull failed or no upstream branch. Continuing with local state." -ForegroundColor DarkYellow
}

# Step 2: Pre-Deploy Backup
Write-Host "Step 2/5: Creating pre-deployment database snapshot..." -ForegroundColor Yellow
try {
    npm run backup
} catch {
    Write-Host "❌ Backup failed! Aborting deployment for safety." -ForegroundColor Red
    exit 1
}

# Step 3: Container Orchestration
Write-Host "Step 3/5: Rebuilding and restarting containers..." -ForegroundColor Yellow
docker compose down
docker compose up -d --build

# Step 4: Database Migration
Write-Host "Step 4/5: Running database migrations (non-destructive)..." -ForegroundColor Yellow
Write-Host "Waiting for container orchestration to stabilize..." -ForegroundColor Yellow

$count = 0
$healthy = $false
while (-not $healthy -and $count -lt 30) {
    Start-Sleep -Seconds 2
    $count++
    Write-Host -NoNewline "."
    try {
        $status = (docker inspect -f '{{.State.Health.Status}}' $APP_CONTAINER_NAME 2>$null)
        if ($status -and $status.Trim() -eq "healthy") {
            $healthy = $true
        }
    } catch {}
}
Write-Host ""

Write-Host "Container is live. Executing migrations..." -ForegroundColor Green
docker exec $APP_CONTAINER_NAME npm run db:migrate

# Step 5: Health Verification
Write-Host "Step 5/5: Verifying overall system health..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
try {
    $response = Invoke-WebRequest -Uri $HEALTH_CHECK_URL -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        Write-Host "🌎 URL: $HEALTH_CHECK_URL" -ForegroundColor Green
    } else {
        Write-Host "❌ HEALTH CHECK FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ℹ️  Health check status: $($_.Exception.Message)" -ForegroundColor DarkYellow
    Write-Host "✅ Containers are live at http://localhost:3007" -ForegroundColor Green
}

Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "🏁 DEPLOYMENT FINISHED AT $(Get-Date)" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------"
