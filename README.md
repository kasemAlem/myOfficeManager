# Management OS (White-Label Project Platform)

A fully generic, highly customizable SaaS deployment built on Next.js 16 (App Router), Prisma, and **PostgreSQL**. Out of the box, this application manages Architecture, Design, Engineering, and Software pipelines through dynamic configuration parameters—without ever touching the underlying source code.

This platform comes fully equipped with a secure Authentication layer, Team Timesheets management, Auditing workflows, multi-layer Financial projections, and interactive pipeline boards.

---

## 🚀 1. Preparing the Environment Settings

Before deploying anywhere, you must construct an environment mapping for the platform.

1. **Copy the Configuration Template**:
   Copy `.env.example` to a live `.env` file containing your production settings.
   ```bash
   cp .env.example .env
   ```

2. **Supply your Details inside `.env`**:
   Populate custom variables like `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_COMPANY_NAME`, and your targeted SMTP Outbox keys.
   *(Note: Set an absolute URL or local path for `NEXT_PUBLIC_APP_LOGO` to instantly brand the primary dashboard UI.)*

3. **Define the Initial Super Administrator**:
   Make sure `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` are safely defined inside your `.env`! These fallback credentials will be securely injected specifically to orchestrate your new installation.

---

## 🐳 2. Deploying Locally via Docker (Container)

A native `docker-compose.yml` file is provided that securely maps the application alongside a persistent **PostgreSQL** Database layer ensuring data isn't wiped across container restarts.

1. Start the Docker daemon and navigate to this directory.
2. Build and boot the stack:
   ```bash
   docker-compose up --build -d
   ```
3. Your application is now running securely bounded to `localhost:3007`.

---

## ☁️ 3. Deploying to a Linux VPS (Host Node / Nginx)

If deploying to an Ubuntu/Debian Host (like DigitalOcean, AWS EC2, or Hetzner) directly via Node runtime instead of Docker.

1. Ensure **Node.js (v20+)** and **npm** are installed.
2. Clone the repository and navigate inside.
3. Install strict dependencies:
   ```bash
   npm ci
   ```
4. **Initialize the Database (First-time only):** 
   If this is a fresh install, run the database clean and baseline migration command:
   ```bash
   npm run db:clean
   ```

---

## 🔄 4. Smooth Upgrades (Automated Pipeline)

Once your application is running, use the automated deployment script for all future updates and database schema changes.

1. **Safe Deployment**: Run a single command to automatically create a database snapshot, pull the latest code, rebuild images, and apply non-destructive database migrations:
   ```bash
   npm run deploy
   ```

2. **Monitoring**: Both the Database and the Application are configured with **Health Checks**. Docker will ensure the database is fully ready before the application attempts to connect.

---

## 🛠 Advanced Features & Recently Added

- **Modern Timesheet UI**:
    - **Visual Presence**: Filled records are highlighted with an emerald green tint and bold indicators, while empty rows are recessed for ultra-fast scanning.
    - **Navigation**: Use the "Today" button to instantly jump back to the current month.
- **Reporting & Exports**:
    - **Global Export**: All users can export their monthly attendance as a professionally formatted `.xlsx` file.
    - **Auto-Notifications**: Managers receive automated monthly reports via email upon timesheet finalization.
- **Enterprise-Grade Backup**:
    - Automated local script with **Rotate-before-write** safety.
    - Optional **Google Drive Integration** for cloud snapshots.
    - See [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) for full setup instructions.
- **Themes**: Live theme switching (Light/Dark/System/Custom) via the Settings Dashboard.
