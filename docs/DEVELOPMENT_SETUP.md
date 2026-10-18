# Windows development setup

This is the teammate guide for running SocialGraphandFeed on Windows 11. Docker Compose runs the frontend, API, MongoDB replica set, Redis, and test runner. You do not need to install Node.js, npm, MongoDB, Redis, or project dependencies on Windows.

## Prerequisites

- Windows 11
- Git for Windows 2.x
- Docker Desktop with the WSL 2 backend, Linux containers, and Docker Compose v2 or newer
- A few GB of free disk space for images, dependency volumes, and database data

Start Docker Desktop and wait until its engine is running. In PowerShell, verify it with:

```powershell
docker info
docker compose version
```

Both commands should complete successfully. `docker info` should show a Server section. No `.env` file is required: Compose supplies local development defaults. `.env.example` lists optional host port overrides; copy it to `.env` only if you need to change those ports. It contains no credentials. Do not put production credentials in `.env.example` or commit a local `.env` file.

## First-time setup

Run these PowerShell commands:

```powershell
git clone https://github.com/SaramshaAdhikari/SocialGraphandFeed.git
Set-Location SocialGraphandFeed
docker compose up --build -d
docker compose ps
```

The last command should show `mongodb`, `redis`, `backend`, and `frontend` as running; all four have health checks. MongoDB's health check initializes the single-node `rs0` replica set required for transactions. The backend waits for MongoDB and Redis; the frontend waits for backend health. The application image installs dependencies reproducibly from `package-lock.json` at build time. Source files under `packages/` are mounted for live editing, while runtime dependencies stay in the image so restarting a service cannot remove another service's dependencies.

The app does not automatically seed the database. For the demo users and posts, run this once:

```powershell
docker compose exec backend npm run seed --workspace=packages/backend
```

The seed operation transactionally replaces only its deterministic fixture records and recalculates fixture counters from persisted relationships. It preserves unrelated records. Re-running it resets changes made to those fixture records. The CLI script was verified in the isolated test MongoDB database. The exact `docker compose exec backend ...` command was not run against the existing development database because it intentionally replaces deterministic fixture IDs there.

## Accessing the application

- Frontend: <http://localhost:3000>
- Backend/API base: <http://localhost:4000/api/v1>
- Backend host: <http://localhost:4000>
- Backend health: <http://localhost:4000/api/v1/health>
- Health through the frontend proxy: <http://localhost:3000/api/v1/health>

The browser calls the same-origin `/api` path. Vite forwards it to the Compose service `backend:4000`; the backend connects to `mongodb:27017` and `redis:6379` over the Compose network. Compose sets `VITE_DATA_SOURCE=live`, so the Docker application uses the backend API. `VITE_DEV_USER_ID` defaults to the seeded internal user ID `usr_0` and `DEV_USER_BYPASS=true` enables that development-only selector. The dev API identity header does not provide production authentication. See [COMMUNITY_MEMBERSHIP.md](COMMUNITY_MEMBERSHIP.md) for membership storage and identity semantics.

## Daily development

Run commands from the repository root in PowerShell:

```powershell
docker compose up -d
docker compose stop
docker compose start
docker compose restart
docker compose restart backend
docker compose up --build -d
docker compose ps
docker compose logs -f --tail=100 backend frontend mongodb redis
```

Source files are mounted into the app containers. After frontend edits, Vite normally applies updates in the browser. In this Windows Docker setup, backend source edits did not reliably trigger the `tsx` watcher, so run `docker compose restart backend` after backend or shared package source changes; that restart workflow was verified. Use `docker compose up --build -d` after changing a package manifest, `package-lock.json`, or `Dockerfile.dev`. `docker compose down` stops and removes the application containers and network but preserves the MongoDB and Redis named volumes. Starting again with `docker compose up -d` reuses those volumes.

## Running tests and checks

The test Compose project uses a disposable MongoDB replica set and Redis service, isolated from the development database and its volumes. `test-runner` is a Docker image with the project lockfile installed. Compose starts the required test services automatically when running the test runner.

Run the full backend suite against real MongoDB and Redis. This is the recommended backend check:

```powershell
docker compose -f docker-compose.test.yml run --build --rm test-runner
```

Run only the MongoDB integration tests against the isolated real replica set:

```powershell
docker compose -f docker-compose.test.yml run --build --rm test-runner sh -c "npm ci && npm run test --workspace=packages/backend -- test/mongo-integration.test.ts"
```

Run the Redis connectivity and TTL test (plus the backend foundation checks that share its test fixture):

```powershell
docker compose -f docker-compose.test.yml run --build --rm test-runner sh -c "npm ci && npm run test:foundation --workspace=packages/backend"
```

Run the frontend suite:

```powershell
docker compose -f docker-compose.test.yml run --build --rm test-runner sh -c "npm ci && npm run test:frontend"
```

Run workspace typecheck and production build:

```powershell
docker compose -f docker-compose.test.yml run --build --rm test-runner sh -c "npm ci && npm run typecheck"
docker compose -f docker-compose.test.yml run --build --rm test-runner sh -c "npm ci && NODE_ENV=production npm run build"
```

To start the test services separately and inspect their health before running checks:

```powershell
docker compose -f docker-compose.test.yml up -d --wait mongodb-test redis-test
docker compose -f docker-compose.test.yml run --build --rm test-runner
docker compose -f docker-compose.test.yml down
```

The runner uses `mongodb-test:27017` and `redis-test:6379` on the isolated Compose network. Backend integration tests use separate test database names and drop only those test databases after each suite. The test MongoDB and Redis services have no data volumes. The separate `test_node_modules` volume contains dependencies only. `docker compose -f docker-compose.test.yml down` removes the test containers and network but retains that dependency volume.

The verified script counts on this checkout are 85 backend tests across 7 files and 171 frontend tests across 10 files. The backend includes 34 real MongoDB integration tests and a Redis TTL check. The suites reported zero skipped tests. Counts may change as tests are added.

## Data persistence and reset

Development data lives in the Compose named volumes `mongodb_data` and `redis_data`. `docker compose down` preserves both. The `node_modules` volume contains installed dependencies, not application data.

To intentionally erase all local development MongoDB and Redis data, stop the app and remove its volumes:

```powershell
docker compose down -v
docker compose up --build -d
```

**Destructive:** `docker compose down -v` permanently deletes the development database and Redis data volumes. It also removes the dependency volume, which is recreated from the image on the next build/start. Back up any data you need before running it. Test containers and databases are separate; the test suite does not clear development volumes.

## Troubleshooting

- **Docker Engine is not running:** open Docker Desktop, wait for its engine, then retry `docker info` and `docker compose version`.
- **Port is already in use:** copy `.env.example` to `.env` and change the relevant `FRONTEND_HOST_PORT`, `BACKEND_HOST_PORT`, `MONGODB_HOST_PORT`, or `REDIS_HOST_PORT` value. For test service host ports, change `MONGODB_TEST_HOST_PORT` or `REDIS_TEST_HOST_PORT`. These are host-side ports; containers continue to use Compose service names and internal ports.
- **A service is unhealthy:** inspect `docker compose ps` and `docker compose logs mongodb redis backend frontend`. Confirm Docker has enough disk space and the configured host ports are free.
- **MongoDB replica set did not initialize:** inspect `docker compose logs mongodb` and wait for the health check. It runs `rs.initiate` for the one-node `rs0` set. Transactions require that replica set. For test MongoDB, inspect `docker compose -f docker-compose.test.yml logs mongodb-test`; do not point test variables at the development database.
- **Redis is unhealthy or backend cannot reach it:** check `docker compose ps redis backend` and `docker compose logs redis backend`, then run `docker compose exec redis redis-cli ping`; it should print `PONG`. The backend uses `redis:6379` on the Compose network. `localhost` inside a container refers to that container itself.
- **Backend cannot reach MongoDB:** inside Compose, use `mongodb:27017`, not `localhost`; inspect `docker compose logs mongodb backend` and verify the `rs0` health check passed.
- **Frontend API proxy fails:** use the frontend at port 3000 and inspect `docker compose logs frontend backend`. The Vite proxy target is `http://backend:4000`; ensure the backend is healthy before diagnosing browser requests.
- **Missing environment variable:** development Compose defaults do not require `.env`. Production mode requires explicit `MONGODB_URI`, `MONGODB_DB_NAME`, and `REDIS_URL` and rejects `DEV_USER_BYPASS=true`. Do not copy production credentials into the example file.
- **Integration tests fail to connect:** use the documented `docker compose -f docker-compose.test.yml run ...` commands, which inject explicit isolated service URLs. Check test service health and port conflicts. The test guard rejects non-local host endpoints outside Compose and refuses to use a development database.
- **Workspace dependency or package-lock errors:** rebuild the image with `docker compose up --build -d` (app) or add `--build` to the documented test-runner command. Docker installs dependencies from `package-lock.json` using `npm ci`.

## Collaboration and Git

Before syncing, check for local changes:

```powershell
git status --short --branch
```

If the working tree is clean, fetch and fast-forward the shared branch:

```powershell
git fetch origin
git merge --ff-only origin/main
```

If local changes are present, save tracked and untracked work before syncing, then restore it:

```powershell
git stash push --include-untracked -m "work before syncing main"
git fetch origin
git merge --ff-only origin/main
git stash pop
git status --short --branch
```

If `git stash pop` reports conflicts, the stash remains available; resolve conflicts and verify the working tree before continuing. Do not use `git reset --hard`, `git clean`, or another destructive command to update your checkout. After a dependency or Compose change, rerun the relevant Docker checks and `git diff --check` before sharing the work.

## Verification record and limits

Verified on Windows 11 with Docker Desktop and Docker Engine. The documented app startup command built both application images and started all four services healthy. The test runner built and passed the backend and frontend suites with the isolated MongoDB replica set and Redis service. Workspace typecheck and build also ran inside Docker. The frontend proxy was exercised with successful and rejected HTTP requests; a post, score, comment, save state, and relationships were read back after restart. `docker compose down` followed by `docker compose up --build -d` preserved the existing MongoDB data and restored all four healthy services. Temporary E2E records were removed by exact ID after verification. `npm audit` reported zero vulnerabilities.

A clean clone was not created for this verification; the commands ran from this existing checkout. No macOS or Linux verification is claimed. Production authentication is intentionally deferred; the development identity header is not suitable for a public or production deployment. MongoDB is a single-node development replica set, not a high-availability deployment.
