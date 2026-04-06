# Management OS (White-Label Project Platform)

A fully generic, highly customizable SaaS deployment built on Next.js 16 (App Router), Prisma, and SQLite. Out of the box, this application manages Architecture, Design, Engineering, and Software pipelines through dynamic configuration parameters—without ever touching the underlying source code.

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

A native `docker-compose.yml` file is provided that securely maps the application alongside a persistent SQLite Database layer ensuring data isn't wiped across container restarts.

1. Start the Docker daemon and navigate to this directory.
2. Build and boot the stack:
   ```bash
   docker-compose up --build -d
   ```
3. Your application is now running securely bounded to `localhost:3000`.

---

## ☁️ 3. Deploying to a Linux VPS (Host Node / Nginx)

If deploying to an Ubuntu/Debian Host (like DigitalOcean, AWS EC2, or Hetzner) directly via Node runtime instead of Docker.

1. Ensure **Node.js (v18+)** and **npm** are installed.
2. Clone the repository and navigate inside.
3. Install strict dependencies and push schema definitions:
   ```bash
   npm ci
   ```
4. Build the Next.js Production Engine:
   ```bash
   npm run build
   ```
5. **Critically Important - Initialize the Database:** Run the database purge command. This wipes historical artifacts entirely and uses your `.env` parameters to deploy the sole Administrative User mentioned above:
   ```bash
   npm run db:clean
   ```
6. Start the deployment server natively (or via PM2):
   ```bash
   npm start
   ```

**(Optional)** Map NGINX or Apache proxy onto port `3000` to bind your official domain to the live node environment!

---

## 🛠 Advanced Features

- **Themes**: Both Administrators and Managers retain access to the **Themes & Appearance** switch within the Settings Dashboard.
- **Reporting**: Weekly/Monthly attendance arrays can be fired utilizing standard JSON Node Mailers via the `/api/timesheets/report` boundary.
