# SocialGraphandFeed

A React/Vite social feed with a Fastify API, MongoDB replica set, and Redis health check. The supported teammate workflow runs the full app and its checks in Docker; Node.js, npm, MongoDB, and Redis do not need to be installed on Windows.

## Run on Windows

Install Git and Docker Desktop with the Linux container engine enabled. From PowerShell:

```powershell
git clone https://github.com/SaramshaAdhikari/SocialGraphandFeed.git
Set-Location SocialGraphandFeed
docker compose up --build -d
```

Open <http://localhost:3000>. The API base is <http://localhost:4000/api/v1>; health is at <http://localhost:4000/api/v1/health>. See [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md) for daily commands, tests, data handling, troubleshooting, and collaboration guidance.

Compose uses safe development defaults. The `X-Dev-User-Id` header is a local identity selector only; production authentication integration remains intentionally outside Milestone 2.

Community membership source-of-truth and the original sidebar/detail mismatch are documented in [docs/COMMUNITY_MEMBERSHIP.md](docs/COMMUNITY_MEMBERSHIP.md).

## Repository layout

- `packages/frontend`: React and Vite UI
- `packages/backend`: Fastify API, MongoDB persistence, and Redis health integration
- `packages/shared`: shared TypeBox API contracts
- `docker-compose.yml`: complete application stack
- `docker-compose.test.yml`: isolated MongoDB/Redis services and Docker test runner
