# SocialGraph & Feed Engineering Platform

A high-performance social platform combining Pinterest-inspired visual discovery, Reddit-inspired threaded community discussions, creator profiles, and a scalable feed engineering architecture inspired by Meta TAO.

---

## Architecture Overview

The repository is structured as an npm monorepo workspaces project:

- **`packages/shared`**: Shared domain contracts, TypeBox validation schemas, TypeBox-to-TypeScript types, and RFC 7807 error problem detail definitions.
- **`packages/backend`**: Fastify REST API, MongoDB Community Server persistence with transactional multi-document integrity, HttpOnly session cookie authentication, and Redis caching/health integration with degraded fallback mode.
- **`packages/frontend`**: React 19 single-page application (SPA) powered by Vite and Tailwind CSS v4. Features custom CSS column-count responsive Masonry visual discovery feeds, Reddit-style threaded comment trees, saved collections, and a dual-client data architecture (instant zero-dependency `MockAdapter` or live `LiveClient` Fastify integration).
- **Docker Assets**: Retained for containerized deployments and CI test runner (`docker-compose.yml`, `docker-compose.test.yml`, `Dockerfile.dev`).

---

## Native Local Development (Primary Workflow)

Native local execution runs Fastify and Vite directly on Windows, macOS, or Linux using Node.js and a native MongoDB service. This eliminates container overhead, drops memory usage by over 2.5 GB, and provides sub-second Vite HMR and instant backend TypeScript reload (`tsx watch`).

### 1. Prerequisites & Version Requirements

- **Operating System**: Windows 10/11 (PowerShell 5.1+ or PowerShell 7+), macOS, or Linux.
- **Node.js**: `v20.x`, `v22.x`, or `v26.x` (verified on `v26.7.0`).
- **Package Manager**: npm `v10.x` or newer (verified on `v12.0.2`).
- **MongoDB**: MongoDB Community Server (`v7.0+`, `v8.0+`, or `v9.0+`) with `mongosh` (MongoDB Shell).
  - *Replica Set Requirement*: MongoDB must be configured as a single-node replica set (`rs0`). Multi-document ACID transactions used by the seed pipeline, follow toggles, and post creation require a replica set member.
- **Redis (Optional)**: Redis 7.x. Redis is **not required** for routine local development. If absent, the backend automatically activates a graceful degraded fallback mode without crashing.

---

### 2. First-Time Setup & Installation

From your terminal (PowerShell on Windows), clone the repository and navigate to the project root:

```powershell
git clone https://github.com/SaramshaAdhikari/SocialGraphandFeed.git
Set-Location SocialGraphandFeed
```

Install workspace dependencies:

```powershell
npm ci
```

Build the shared contract package (required so `@socialgraph/backend` and `@socialgraph/frontend` can resolve shared types):

```powershell
npm run build --workspace=@socialgraph/shared
```

Create your local environment file from the provided example:

```powershell
Copy-Item .env.example .env
```

The default values in `.env` are preconfigured for native local development on standard ports:
- `PORT=4000`
- `HOST=127.0.0.1`
- `MONGODB_URI=mongodb://127.0.0.1:27017/socialgraph?replicaSet=rs0&directConnection=true`
- `MONGODB_DB_NAME=socialgraph`
- `REDIS_URL=redis://127.0.0.1:6379`
- `VITE_DATA_SOURCE=live`
- `VITE_API_PROXY_TARGET=http://127.0.0.1:4000`
- `SESSION_SECRET=development-only-session-secret-change-me`
- `WEB_ORIGIN=http://localhost:3000`

---

### 3. Native MongoDB Configuration (Replica Set `rs0`)

Because multi-document transactions in SocialGraph use MongoDB sessions (`runInTransaction`), standalone MongoDB instances will throw `MongoServerError: Transaction numbers are only allowed on a replica set member`. Configuring a local single-node replica set (`rs0`) is required.

#### A. Enable Replication in `mongod.cfg`

1. Locate your MongoDB configuration file. On Windows, it is typically located at:
   `C:\Program Files\MongoDB\Server\<version>\bin\mongod.cfg`
2. Open the file in an editor with Administrator privileges.
3. Add or uncomment the `replication` section:
   ```yaml
   replication:
     replSetName: rs0
   ```
4. Save the file and restart the MongoDB Windows Service from an Administrator PowerShell terminal:
   ```powershell
   Restart-Service MongoDB
   ```

#### B. Initialize the Replica Set

Open `mongosh` in PowerShell:

```powershell
mongosh
```

In the MongoDB shell, initiate the replica set (only needed once):

```javascript
rs.initiate()
```

Wait 2–5 seconds, then verify the replica set status:

```javascript
rs.status().myState
```

A return value of `1` confirms the node is in `PRIMARY` state and ready for transactional operations. You can exit `mongosh` by typing `exit`.

---

### 4. Redis Configuration & Graceful Fallback

- **Core vs. Optional**: Redis is used for feed caching and fast health checks. However, Redis is **not mandatory** for daily local frontend or backend development.
- **Graceful Fallback Mode**: If Redis is not installed or not running, the Fastify backend logs:
  `WARN: Redis initial connection failed. Fallback mode active.`
  The server continues serving all API routes normally with HTTP 200, and reports `status: "degraded"` on `/api/v1/health`.
- If you have Redis installed natively (via WSL, Windows Redis port, or Memurai), it will automatically connect on `redis://127.0.0.1:6379`.

---

### 5. Database Seeding & Development Administrator Bootstrap

#### A. Seed Realistic Development Data

Seed the database with 20 authentic fictional personas (`usr_0`..`usr_19`), 5 canonical communities, visual pins, discussions, threaded comments, and relationship counters:

```powershell
npm run seed
```

*Safety & Idempotency Guarantees:*
- The seed script is insert-only and scoped to its deterministic fixture IDs.
- Existing custom roles, passwords, and user modifications on `alex_dev` (`usr_0`) are preserved.
- Non-seed documents and unrelated user data are never replaced or wiped.
- Counters and community member counts are automatically reconciled.

#### B. Bootstrap the Development Administrator Account

To test authenticated routes and administrator features in local development, provision credentials for the existing `alex_dev` persona using your own chosen local development password:

```powershell
$env:NODE_ENV="development"
$env:DEV_ADMIN_BOOTSTRAP="true"
$env:DEV_ADMIN_PASSWORD="<your-unique-dev-password>"
npm run auth:bootstrap-admin
```

This assigns:
- **Username / Identifier**: `alex_dev` (or development login alias `admin`)
- **Password**: Your supplied `$env:DEV_ADMIN_PASSWORD` (stored as a bcrypt hash)
- **Role**: Promoted to `admin`

To change or update your password later, include `$env:DEV_ADMIN_RESET_PASSWORD="true"`.

*(In production, this bootstrap command, default credentials, and the `admin` login alias are strictly rejected by environment configuration guards.)*

---

### 6. Starting the Application

Start the backend and frontend in two separate terminals from the repository root:

#### Terminal 1 — Backend API (Fastify with Hot-Reload)

```powershell
npm run dev:backend
```
- Listens at: <http://127.0.0.1:4000>
- Direct API base: <http://127.0.0.1:4000/api/v1>
- Hot-reloads on TypeScript changes via `tsx watch`.

#### Terminal 2 — Frontend UI (Vite Dev Server with HMR)

```powershell
npm run dev:frontend
```
- Opens at: <http://localhost:3000>
- Automatically proxies all `/api/*` network requests to <http://127.0.0.1:4000>.
- Fast instant hot-module replacement (HMR).

---

### 7. Health Checks & Verification

Verify that both frontend and backend are communicating properly:

1. **Direct Backend Health Check**:
   Visit <http://127.0.0.1:4000/api/v1/health> or run:
   ```powershell
   Invoke-RestMethod http://127.0.0.1:4000/api/v1/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "version": "0.1.0",
     "services": {
       "mongodb": { "status": "connected" },
       "redis": { "status": "connected" }
     }
   }
   ```
   *(Note: `status: "degraded"` with Redis disconnected is completely valid for local development).*

2. **Proxied Health Check via Vite**:
   Visit <http://localhost:3000/api/v1/health>.
   A successful JSON response confirms the Vite development proxy is actively forwarding traffic to Fastify.

3. **Browser Application**:
   Open <http://localhost:3000> to interact with the full application.

---

### 8. Testing, Typecheck & Production Builds

All testing and build commands run directly through root workspace scripts:

#### Frontend Unit & Component Tests (Vitest)
Executes all 13 frontend test suites (206 tests) covering Masonry columns, responsive navigation, theme switching, profile feeds, and API state:
```powershell
npm run test:frontend
```

#### Monorepo TypeScript Check
Typechecks all workspaces (`@socialgraph/shared`, `@socialgraph/backend`, `@socialgraph/frontend`) with zero emissions:
```powershell
npm run typecheck
```

#### Production Bundle Build
Compiles the shared package, runs `tsc -b`, and builds the optimized Vite distribution:
```powershell
npm run build
```

#### Backend Integration Tests
Backend integration tests run against isolated test databases. They require an isolated test MongoDB replica set (configured via `MONGODB_TEST_URI`):
```powershell
$env:MONGODB_TEST_URI="mongodb://127.0.0.1:27018/?replicaSet=rs0&directConnection=true"
$env:REDIS_TEST_URL="redis://127.0.0.1:6380"
npm run test:backend
```

---

### 9. Common Errors & Troubleshooting

| Error | Root Cause | Solution |
| :--- | :--- | :--- |
| `MongoServerError: Transaction numbers are only allowed on a replica set member` | Native MongoDB is running as a standalone node rather than a replica set. | Add `replication: replSetName: rs0` to `mongod.cfg`, restart the service (`Restart-Service MongoDB`), and execute `rs.initiate()` in `mongosh`. |
| `Cannot find module '@socialgraph/shared'` or `'tsc' is not recognized` | Shared workspace is unbuilt or root dependencies are missing. | Run `npm ci` at repository root, followed by `npm run build --workspace=@socialgraph/shared`. |
| `EADDRINUSE: address already in use 127.0.0.1:4000` (or `3000`) | Another process or a previously running container is holding the port. | Check active ports with `Get-NetTCPConnection -LocalPort 3000, 4000` and stop the conflicting process. |
| `Failed to connect to MongoDB on 127.0.0.1:27017` | The MongoDB Community Server Windows service is stopped. | Run `Get-Service MongoDB` to check status and `Start-Service MongoDB` to start it. |
| `Vite proxy error: ECONNREFUSED 127.0.0.1:4000` | The Fastify backend server is not running on port 4000. | Run `npm run dev:backend` in Terminal 1 before using the frontend in live mode. |
| `Redis connection warning on startup` | Redis service is stopped or not installed. | This is normal and non-blocking in development. Fastify operates in degraded fallback mode. |

---

## Retained Docker Support

Docker and Docker Compose configurations remain fully supported for containerized team workflows, isolated test runners, and CI/CD environments.

### Running with Docker Compose

If you prefer to run the entire application inside Docker Desktop:

```powershell
# Start all services (MongoDB, Redis, Fastify backend, Vite frontend)
docker compose up --build -d

# Check service health
docker compose ps

# Seed development data inside the backend container
docker compose exec backend npm run seed --workspace=packages/backend

# Bootstrap development administrator inside container using your chosen password
docker compose exec -T -e NODE_ENV=development -e DEV_ADMIN_BOOTSTRAP=true -e DEV_ADMIN_PASSWORD="<your-unique-dev-password>" backend npm run auth:bootstrap-admin --workspace=@socialgraph/backend
```

### Running Isolated Test Services with Docker

To run the backend integration tests without installing native test databases:

```powershell
docker compose -f docker-compose.test.yml run --build --rm test-runner
```

To stop all Docker containers and free resources:

```powershell
docker compose down
```
*(Named volumes `mongodb_data` and `redis_data` are preserved; use `-v` only if you intentionally wish to wipe persistent Docker volumes).*

---

## Collaboration & Git Workflow

- **Branch**: Feature development occurs on dedicated feature branches (e.g. `feature/frontend-refinement`).
- **Clean Commits**: Review working-tree changes with `git status --short` before staging.
- **Safeguards**: Never commit `.env` containing sensitive credentials or tokens. Always use `.env.example` with non-secret placeholders.
