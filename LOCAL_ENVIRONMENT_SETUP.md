# Local Environment & Container Infrastructure Setup Report

## 1. Overview & System Specification
This document establishes the formal configuration, container topology, networking architecture, and persistence mechanisms employed to create a fully reproducible, offline-capable local testing environment for the **SocialGraph & Feed Engineering Platform** (Git baseline: `94540883ab99b8862ac995fa9afebc2e9eadaa16`).

| Host Component | Specification |
| :--- | :--- |
| **Operating System** | Microsoft Windows 11 Home (Version 24H2, Build 26100.3194) |
| **Virtualization Subsystem** | Windows Subsystem for Linux (WSL2), Kernel 5.15.167.4-microsoft-standard-WSL2 |
| **WSL Distribution** | Ubuntu 22.04 LTS (`Ubuntu-22.04`) |
| **Container Engine** | Docker Engine version 28.5.1, build e006f15 |
| **Compose Orchestrator** | Docker Compose version v2.40.3 (Linux x86_64) |
| **Node.js Runtime** | Node.js v22.14.0 (Windows Native) |
| **Package Manager** | npm v10.9.2 |
| **Browser Engine** | Google Chrome v130.0.6723.117 (Windows x64) |

---

## 2. Container Topology & Port Allocation Matrix
The architecture requires strict isolation between **development execution** (manual/live browsing) and **automated integration test execution** (Vitest regression suites) to avoid wiping data or polluting state.

```
                      +-------------------------------------------------------+
                      |                   HOST (Windows 11)                   |
                      |                                                       |
                      |   Frontend (3000)  <--proxy--   Backend API (4000)    |
                      +------------+---------------------------+--------------+
                                   |                           |
                 WSL2 Inter-VM Nat | (127.0.0.1 Port Forward)  |
                                   v                           v
+---------------------------------------------------------------------------------------------+
|                                    WSL2 (Ubuntu-22.04)                                      |
|                                                                                             |
|   +---------------------------------------+   +-----------------------------------------+   |
|   |         DEVELOPMENT SERVICES          |   |            TEST SERVICES                |   |
|   |                                       |   |                                         |   |
|   |  - socialgraph-mongodb-1 (rs0)        |   |  - socialgraph-test-mongodb-test-1 (rs0)|   |
|   |    Host: 127.0.0.1:27027              |   |    Host: 127.0.0.1:27018                |   |
|   |    Container: mongo:7.0.14:27017      |   |    Container: mongo:7.0.14:27017        |   |
|   |                                       |   |                                         |   |
|   |  - socialgraph-redis-1                |   |  - socialgraph-test-redis-test-1        |   |
|   |    Host: 127.0.0.1:6387               |   |    Host: 127.0.0.1:6380                 |   |
|   |    Container: redis:7.4.2-alpine:6379 |   |    Container: redis:7.4.2-alpine:6379   |   |
|   +---------------------------------------+   +-----------------------------------------+   |
+---------------------------------------------------------------------------------------------+
```

### Detailed Port Allocation:

| Service Role | Container Name | Image | Host Port | Target Port | Replica Set | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Dev Database** | `socialgraph-mongodb-1` | `mongo:7.0.14` | `27027` | `27017` | `rs0` | Seeded database for running application |
| **Dev Cache** | `socialgraph-redis-1` | `redis:7.4.2-alpine` | `6387` | `6379` | N/A | Session store & feed delivery cache |
| **Test Database** | `socialgraph-test-mongodb-test-1`| `mongo:7.0.14` | `27018` | `27017` | `rs0` | Vitest integration test suites (transient) |
| **Test Cache** | `socialgraph-test-redis-test-1` | `redis:7.4.2-alpine` | `6380` | `6379` | N/A | Distributed rate limit & lock testing |
| **Native Fallback**| `pulsegraph-mongodb` | `mongo:7.0` | `27017` | `27017` | Standalone | Non-transactional fallback |
| **Native Cache** | `pulsegraph-redis` | `redis:7.2-alpine` | `6379` | `6379` | N/A | Non-isolated default cache |

---

## 3. WSL2 Subsystem Persistence Mechanism
In Windows 11 WSL2, idle distributions terminate within 15 seconds if no foreground processes remain active. To ensure Docker containers remained continuously operational throughout testing, a background daemon keeper was launched:

```powershell
# Background process maintaining Ubuntu-22.04 session state
wsl -d Ubuntu-22.04 -- sleep 86400
```
This guarantees that:
1. Docker daemon (`dockerd`) remains active.
2. Port forwarding bindings between `127.0.0.1` (Windows host) and WSL2 virtual interface remain valid.
3. MongoDB replica set elections (`rs0`) remain stable.

---

## 4. Environment Configuration (`.env`)
The local testing environment configuration file is maintained at:
[`.env`](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/.env)

Key variables configured:
```ini
NODE_ENV=development
PORT=4000
HOST=127.0.0.1
LOG_LEVEL=info

# Primary Development Data Services (Docker Containers)
MONGODB_URI=mongodb://127.0.0.1:27027/socialgraph?replicaSet=rs0&directConnection=true
MONGODB_DB_NAME=socialgraph
REDIS_URL=redis://127.0.0.1:6387

# Automated Test Isolation Services (Vitest Safeguard)
MONGODB_TEST_URI=mongodb://127.0.0.1:27018/?replicaSet=rs0&directConnection=true
REDIS_TEST_URL=redis://127.0.0.1:6380

# Application Features & Storage
STORAGE_PROVIDER=local
DEV_USER_BYPASS=false
SESSION_SECRET=development-only-session-secret-change-me-local-test
WEB_ORIGIN=http://localhost:3000
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_LOGIN_WINDOW_SEC=60
RATE_LIMIT_REGISTER_MAX=3
RATE_LIMIT_REGISTER_WINDOW_SEC=60
FOOW_MAX_FOLLOWERS_THRESHOLD=500
ALLOW_ATLAS_SEED=false
```

---

## 5. Database Seeding & Fixture Verification
The local development database was seeded using the backend fixture tool:
```powershell
npm run seed --workspace=@socialgraph/backend
```

### Seeding Output & Verified Entities:
- **Users**: 110 accounts created (including default test user `alex_dev`, administrator accounts, and mock creators).
- **Discussions & Visual Posts**: 500 posts across various engineering communities.
- **Threaded Comments**: 298 discussion comments.
- **Social Graph Edges**: 435 follower/following relationships.
- **Communities**: 18 engineering topics (`systems`, `frontend`, `distributed`, `backend`, `cloud`).

---

## 6. Connectivity Verification
All endpoints were verified prior to test execution:

```powershell
node -e "
const net = require('net');
const ports = [27018, 27027, 6380, 6387];
ports.forEach(p => {
  const s = net.createConnection({ host: '127.0.0.1', port: p }, () => {
    console.log('Port ' + p + ': OPEN'); s.end();
  });
});
"
```
**Result**: All 4 container ports responded `OPEN` within 2ms.
Replica set health check: `{ ok: 1, set: 'rs0', primary: 'mongodb:27017' }`.
Redis health check: `PONG`.
