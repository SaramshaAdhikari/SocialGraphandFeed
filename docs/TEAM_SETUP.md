# SocialGraph — Teammate Onboarding & Team Environment Guide

This guide provides step-by-step instructions for teammates joining the SocialGraph platform development on the **`life`** branch. Follow these instructions to configure your workstation once, connect to the shared development database (`socialgraph-dev` on MongoDB Atlas), use shared media storage, and run the platform locally on native Windows.

---

## 1. Architecture & Design Philosophy

SocialGraph is an engineering platform inspired by Meta TAO and Pinterest, featuring:
- **Shared Development Database**: Team Atlas cluster (`socialgraph-dev`) with pre-seeded personas, communities, relationship graph, and post feeds so all teammates share a common development state.
- **Shared Cloud Media Storage**: Remote CDN storage via Cloudinary providing durable, cross-machine HTTPS URLs for post images.
- **Strict Database Isolation**:
  - **Shared Dev DB**: Used for interactive local server development.
  - **Local Dev DB**: Optional standalone local replica set for offline development.
  - **Test DB**: Dedicated isolated test database (`port 27018`). Automated test suites are hard-coded to refuse execution against Atlas.
- **Native Windows First**: Zero Docker requirement for day-to-day development.

---

## 2. Prerequisites

Ensure your workstation meets the following requirements before setup:

1. **Operating System**: Windows 10/11 (or macOS / Linux).
2. **Node.js**: Version **>= 20.0.0** (Verify with `node -v`).
3. **npm**: Version **>= 10.0.0** (Bundled with Node.js).
4. **Redis**: Running locally on port **6379** (e.g. Redis for Windows / Memurai / native WSL service).
5. **Git**: Installed and configured.

---

## 3. Quickstart: 5-Minute Setup Walkthrough

### Step 1: Clone & Switch to the `life` Branch
```bash
git clone <repository_url> SocialGraphandFeed
cd SocialGraphandFeed
git checkout life
```

### Step 2: Install Workspace Dependencies
```bash
npm install
```
This installs dependencies across all workspaces (`@socialgraph/shared`, `@socialgraph/backend`, `@socialgraph/frontend`).

### Step 3: Configure Environment Variables
Copy the example environment template:
```bash
# Windows PowerShell:
Copy-Item .env.example .env

# Or Bash:
cp .env.example .env
```

Open `.env` in your editor and configure the shared Atlas URI:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@socialgraph-dev.xxxx.mongodb.net/socialgraph?retryWrites=true&w=majority
MONGODB_DB_NAME=socialgraph
REDIS_URL=redis://127.0.0.1:6379
SESSION_SECRET=development-only-session-secret-change-me
STORAGE_PROVIDER=local
```
*(Contact your team lead or check your team password manager for the shared Atlas credentials).*

### Step 4: Validate Your Setup
Run the automated environment and service verification utility:
```bash
npm run check:env
```
The validator checks Node.js runtime, `.env` format, MongoDB latency, Redis connectivity, and build status. All credentials are automatically redacted in the output.

### Step 5: Start the Development Application
Launch the backend and frontend dev servers:
```bash
# Terminal 1: Fastify Backend API (Port 4000)
npm run dev:backend

# Terminal 2: Vite Frontend Application (Port 3000)
npm run dev:frontend
```

Open your browser to **[http://localhost:3000](http://localhost:3000)**.

---

## 4. Shared MongoDB Atlas (`socialgraph-dev`)

### Cluster Overview
- **Cluster Name**: `socialgraph-dev`
- **Deployment**: 3-node replica set on MongoDB Atlas (AWS / GCP region).
- **Replica Set Support**: Multi-document transactions (e.g. community memberships, follows) are natively supported.
- **Indexes**: Automatically verified and managed on connection via `ensureIndexes()`.

### Network Access (IP Allowlist)
To connect to the shared cluster:
1. Obtain access to the MongoDB Atlas project or share your public IP with the team administrator.
2. In Atlas Console -> **Network Access** -> **IP Access List**:
   - Add your current workstation public IP (e.g. `203.0.113.45/32` or your corporate VPN CIDR).
   - **SECURITY RULE**: Never add `0.0.0.0/0` (Allow Access from Anywhere). Restricting database access to explicit developer and CI IPs is an essential baseline defense against brute-force and credential-stuffing attacks.

### User Permissions & Least Privilege
- Developers connect using a dedicated database user granted strictly the `readWrite` role scoped to the `socialgraph` database.
- **Why Least Privilege Matters**: Never use or share cluster administrator credentials (`atlasAdmin` or `dbAdminAnyDatabase`). Restricting credentials to `readWrite` on the application database prevents accidental cluster reconfiguration, accidental deletion of other databases, and unintended privilege escalation.

---

## 5. Shared Media Storage (Cloudinary)

In local standalone development, image uploads are stored in `packages/backend/public/uploads`. However, this limits visibility to the single machine where the upload took place.

To enable cross-machine media sharing among teammates:
1. Obtain Cloudinary team credentials.
2. Set the following in `.env`:
   ```env
   STORAGE_PROVIDER=cloudinary
   CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
   ```
   *Alternatively, configure individual keys: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.*
3. When active, all uploaded media receives a permanent HTTPS CDN URL accessible on all team devices.
4. **Offline Fallback**: If `STORAGE_PROVIDER=local`, media is safely saved to the local filesystem without external dependencies.

---

## 6. Security & Isolation Safeguards

The repository includes strict safeguards to prevent accidents in shared environments:

| Safeguard | Description | Enforcement Mechanism |
|---|---|---|
| **Test Suite Isolation** | Automated test suites (`npm test`) are strictly prevented from targeting Atlas. | `env.ts` throws a critical error if `MONGODB_TEST_URI` contains `mongodb+srv:` or `.mongodb.net`. Tests strictly require local port 27018. |
| **Accidental Wipe Protection** | Broad database seeding is blocked on Atlas by default. | `npm run seed` aborts with an error if targeting an Atlas cluster unless `--allow-atlas-seed` is explicitly passed. |
| **Ephemeral Session Exclusion** | User login sessions are never migrated to shared Atlas. | `scripts/migrate_to_atlas.mjs` explicitly ignores the `sessions` collection. |
| **Credential Redaction** | Passwords and connection strings are masked in logs. | All CLI scripts redact credentials (`:***@`) before writing to console or reports. |

---

## 7. Migration & Backup Utilities

### Backing Up Database State
To create a complete snapshot of all collections to timestamped JSON archives:
```bash
npm run backup:db
```
Archives are saved to `backups/backup-<timestamp>/` with verification checksums and a `manifest.json`. The `backups/` directory is gitignored.

### Migrating Local Data to Atlas
To migrate existing local data into the shared Atlas cluster safely:
```bash
# 1. Preview changes (Dry Run - no writes):
npm run migrate:atlas -- --dry-run --target="mongodb+srv://..."

# 2. Execute live idempotent migration:
npm run migrate:atlas -- --target="mongodb+srv://..."
```
- Existing documents on Atlas are **never** overwritten or destroyed.
- Missing documents are upserted cleanly.
- Indexes are automatically created on the target cluster.

### Migrating Local Media to Cloud Storage
To upload local disk media references to Cloudinary:
```bash
# 1. Preview media to migrate:
npm run migrate:media -- --dry-run

# 2. Upload to Cloudinary and update post URLs:
npm run migrate:media
```

---

## 8. Common Development Workflows

### Running Tests Safely
```bash
# Run frontend tests (24 test files, 292 tests):
npm run test:frontend

# Run backend tests (requires isolated test DB on port 27018):
$env:MONGODB_TEST_URI="mongodb://127.0.0.1:27018/?replicaSet=rs0&directConnection=true"
$env:REDIS_TEST_URL="redis://127.0.0.1:6380"
npm run test:backend

# Run live verification scripts (against running dev server on port 4000/3000):
python scripts/verify_final_ux_corrections.py
python scripts/verify_phase_f3_graph.py
node scripts/verify_phase_g_messaging.mjs
```

### Typechecking
```bash
# Check TypeScript across the entire monorepo:
npm run typecheck
```

### Building for Production
```bash
# Build shared library, backend bundle, and frontend static assets:
npm run build
```

---

## 9. Credential Rotation Procedures

If team credentials need to be updated:
1. **Atlas Database User**:
   - The team administrator generates a new password in Atlas -> Database Access.
   - Update `MONGODB_URI` in `.env` on your workstation.
   - Run `npm run check:env` to verify the new connection.
2. **Cloudinary API Key / Secret**:
   - Generate a new API key in the Cloudinary Settings Console.
   - Update `CLOUDINARY_URL` in `.env`.
   - Run `npm run check:env` to verify the configuration.
3. **Session Secret**:
   - Update `SESSION_SECRET` in `.env`. Existing active login sessions will simply expire.

---

## 10. Troubleshooting FAQ

**Q: `npm run check:env` reports "MongoDB connection failed: queryTxt ETIMEOUT"**
> **A:** Your current public IP is likely not in the Atlas Network Access allowlist. Log into Atlas Console -> Network Access and add your current IP address (`/32`). Also check that outbound port 27017 is not blocked by a corporate firewall or VPN.

**Q: `npm run check:env` reports "Redis connection failed"**
> **A:** Redis is not running locally. Start your Redis server:
> - On Windows with Memurai: ensure the Memurai Windows service is running.
> - With Redis CLI: run `redis-server` in a separate command window.

**Q: Can I run completely offline without an internet connection?**
> **A:** Yes! In `.env`, set:
> ```env
> MONGODB_URI=mongodb://127.0.0.1:27017/socialgraph?replicaSet=rs0&directConnection=true
> STORAGE_PROVIDER=local
> ```
> This runs entirely against your local MongoDB and local filesystem.


---

## 11. Key Architecture Boundaries & Latest Release Reports

### Monorepo Boundaries
- **`@socialgraph/shared`**: Pure domain types, schemas (TypeBox), and RFC 7807 problem details. Zero server or DOM dependencies.
- **`@socialgraph/backend`**: Fastify HTTP server, MongoDB transactional stores, session authentication, and Server-Sent Events (SSE).
- **`@socialgraph/frontend`**: React 19 + Vite + Tailwind CSS v4 SPA. Supports live API communication (`LiveClient`) and fallback mock testing (`MockAdapter`).

### Implementation & Verification Reports
- `final_handover_report.md`: Final release audit, git safety itemization, and handover checklist for Nishot.
- `final_product_readiness_report.md`: Verification of final UX corrections (stat counts, unified profile editing, button alignments).
- `phase_i_final_ui_polish_report.md`: Visual transformation, neutral dark theme, graph redesign, and full-page messaging layout.
- `docs/REALTIME_SOCIAL_GRAPH_DEMO.md`: Realtime social graph and SSE event streaming demo.
- `docs/CREATE_POST_WORKFLOW.md`: Unified post creation, drafts, and media pipeline.
