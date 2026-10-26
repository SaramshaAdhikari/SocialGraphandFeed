# Windows Development Setup

This guide documents the development workflows for SocialGraph on Windows 11. The repository supports two distinct workflows:

1. **Native Local Development (Primary / Recommended)**: Runs Fastify, Vite, and MongoDB natively on Windows with Node.js. Requires zero Docker containers, uses minimal CPU and RAM (<3.5 GB total system usage), and offers sub-second Vite HMR and instant TypeScript hot-reloading (`tsx watch`).
2. **Docker Compose (Alternative / Containerized)**: Retained for containerized team workflows, isolated test runners, and CI environments where running the full stack inside Linux containers is preferred.

---

## 1. Native Windows Development (Zero Docker Required)

### Prerequisites

- **Windows 10 or 11** with PowerShell 5.1+ or PowerShell 7+.
- **Node.js**: `v20.x`, `v22.x`, or `v26.x` (verified on `v26.7.0`).
- **npm**: `v10.x` or newer (verified on `v12.0.2`).
- **MongoDB Community Server**: `v7.0+`, `v8.0+`, or `v9.0+` installed as a Windows Service and configured with single-node replica set `rs0`.
- **mongosh**: MongoDB Shell (installed at `C:\Program Files\mongosh\bin\mongosh.exe` or available in system PATH).
- **Redis (Optional)**: Optional in development. Fastify operates in a degraded fallback mode if Redis is absent.

---

### Step-by-Step Native Setup

#### 1. Clone & Install Dependencies

From PowerShell:

```powershell
git clone https://github.com/SaramshaAdhikari/SocialGraphandFeed.git
Set-Location SocialGraphandFeed
npm ci
```

#### 2. Build Shared Contracts

Before starting either backend or frontend, compile the shared TypeBox schemas:

```powershell
npm run build --workspace=@socialgraph/shared
```

#### 3. Configure Local Environment

Copy `.env.example` to `.env`:

```powershell
Copy-Item .env.example .env
```

The default values in `.env` are configured for native execution:
```ini
NODE_ENV=development
PORT=4000
HOST=127.0.0.1
MONGODB_URI=mongodb://127.0.0.1:27017/socialgraph?replicaSet=rs0&directConnection=true
MONGODB_DB_NAME=socialgraph
REDIS_URL=redis://127.0.0.1:6379
VITE_DATA_SOURCE=live
VITE_API_PROXY_TARGET=http://127.0.0.1:4000
SESSION_SECRET=development-only-session-secret-change-me
WEB_ORIGIN=http://localhost:3000
```

#### 4. Configure MongoDB Replica Set (`rs0`)

Multi-document transactions in SocialGraph require MongoDB to be a member of a replica set. A single-node replica set `rs0` satisfies this requirement.

1. Open `C:\Program Files\MongoDB\Server\<version>\bin\mongod.cfg` as Administrator.
2. Ensure the `replication` section is configured:
   ```yaml
   replication:
     replSetName: rs0
   ```
3. Restart the Windows service:
   ```powershell
   Restart-Service MongoDB
   ```
4. Initiate the replica set in `mongosh`:
   ```powershell
   mongosh --eval "rs.initiate()"
   ```
5. Confirm that `rs.status().myState` returns `1` (`PRIMARY`):
   ```powershell
   mongosh --quiet --eval "printjson({ ok: rs.status().ok, myState: rs.status().myState })"
   ```

#### 5. Seed Development Data & Bootstrap Admin

Seed the database with 20 realistic personas, 5 communities, visual pins, discussions, and relationships:

```powershell
npm run seed
```

Bootstrap credentials for `alex_dev` (`usr_0`) to test authenticated user interactions with your chosen local password:

```powershell
$env:NODE_ENV="development"
$env:DEV_ADMIN_BOOTSTRAP="true"
$env:DEV_ADMIN_PASSWORD="<your-unique-dev-password>"
npm run auth:bootstrap-admin
```
*(Promotes `alex_dev` to role `admin` and provisions the hashed password. To reset or change it later, add `$env:DEV_ADMIN_RESET_PASSWORD="true"`).*

#### 6. Start Development Servers

Open two PowerShell terminals:

- **Terminal 1 (Backend API):**
  ```powershell
  npm run dev:backend
  ```
  API starts at <http://127.0.0.1:4000>.

- **Terminal 2 (Frontend UI):**
  ```powershell
  npm run dev:frontend
  ```
  Vite UI starts at <http://localhost:3000> and automatically proxies `/api/*` requests to port 4000.

---

## 2. Fast Frontend-Only UI Development (Mock Mode)

If you are designing UI components, working on styling, or modifying React views without needing MongoDB or the backend API:

```powershell
$env:VITE_DATA_SOURCE="mock"; npm run dev --workspace=packages/frontend
```

The application opens at <http://localhost:3000> using the built-in `MockAdapter` and rich in-memory fixtures. No background services are required.

---

## 3. Hybrid Development (Native Node.js + Minimal Docker Database)

If a developer does not wish to install native MongoDB Community Server on Windows, they can run only the database container in Docker while running Fastify and Vite natively:

1. **Start only the MongoDB container in Docker:**
   ```powershell
   docker compose up -d mongodb
   docker compose stop backend frontend redis
   ```
2. **Point your `.env` to the Docker-published host port `27027`:**
   ```powershell
   $env:MONGODB_URI="mongodb://127.0.0.1:27027/?replicaSet=rs0&directConnection=true"
   ```
3. **Start backend and frontend natively:**
   ```powershell
   npm run dev:backend
   npm run dev:frontend
   ```

---

## 4. Full Docker Compose Workflow (Containerized)

Docker Desktop remains supported for developers who prefer running all services in containers:

### First-Time Docker Setup

```powershell
git clone https://github.com/SaramshaAdhikari/SocialGraphandFeed.git
Set-Location SocialGraphandFeed
docker compose up --build -d
docker compose ps
```

The services `mongodb`, `redis`, `backend`, and `frontend` will start with container health checks.

### Seeding in Docker

```powershell
docker compose exec backend npm run seed --workspace=packages/backend
docker compose exec -T -e NODE_ENV=development -e DEV_ADMIN_BOOTSTRAP=true -e DEV_ADMIN_PASSWORD="<your-unique-dev-password>" backend npm run auth:bootstrap-admin --workspace=@socialgraph/backend
```

### Stopping Docker Services

```powershell
docker compose stop
# Or to remove containers while preserving persistent volumes:
docker compose down
```

---

## 5. Running Tests & Quality Gates

All checks can be run directly from the repository root:

### Frontend Unit & Component Suites (Vitest)
Runs 13 test suites (206 passing tests) with zero Docker dependencies:
```powershell
npm run test:frontend
```

### Monorepo Typecheck
Verifies TypeScript compilation across `@socialgraph/shared`, `@socialgraph/backend`, and `@socialgraph/frontend`:
```powershell
npm run typecheck
```

### Production Build
Tests production compilation and bundle generation:
```powershell
npm run build
```

### Backend Integration Suites
Runs against isolated test databases. Requires an isolated test MongoDB replica set:
```powershell
# Using isolated native test ports:
$env:MONGODB_TEST_URI="mongodb://127.0.0.1:27018/?replicaSet=rs0&directConnection=true"
$env:REDIS_TEST_URL="redis://127.0.0.1:6380"
npm run test:backend

# Or using the Docker test runner:
docker compose -f docker-compose.test.yml run --build --rm test-runner
```

---

## 6. Troubleshooting & Common Issues

- **Transaction numbers are only allowed on a replica set member:**
  - *Cause*: MongoDB is running in standalone mode.
  - *Fix*: Add `replication: replSetName: rs0` to `mongod.cfg`, restart the service (`Restart-Service MongoDB`), and run `rs.initiate()` in `mongosh`.
- **Port 3000 or 4000 already in use:**
  - *Cause*: A background process or previous Docker container is holding the port.
  - *Fix*: Run `Get-NetTCPConnection -LocalPort 3000, 4000` to find the process ID, or run `docker compose stop backend frontend` if containers were running.
- **Cannot find module '@socialgraph/shared':**
  - *Cause*: The shared contract library was not built prior to launching backend or frontend.
  - *Fix*: Run `npm run build --workspace=@socialgraph/shared`.
- **Redis connection warning on startup:**
  - *Cause*: Redis is not installed or running.
  - *Fix*: This warning is non-blocking in development. Fastify operates in degraded fallback mode without errors.
- **Vite API proxy fails (ECONNREFUSED):**
  - *Cause*: Fastify backend is not running on port 4000.
  - *Fix*: Start the backend with `npm run dev:backend`.
