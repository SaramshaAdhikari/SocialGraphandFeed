# Formal Testing Environment & System Infrastructure Specifications

**Audit Baseline Commit:** `eb1f5ba4be1edd35f148d1f18a3dc748458828fb`  
**Evaluation Date:** November 24, 2026  
**Auditor:** Independent Software Testing & QA Verification Agent  

---

## 1. Hardware Environment Specification

| Component | Verified Host Specification | Minimum Academic Recommended |
| :--- | :--- | :--- |
| **Processor (CPU)** | Intel(R) Core(TM) i3-1005G1 (2 Cores, 4 Threads) @ 1.20 GHz (Turbo up to 3.40 GHz) | Dual-Core 2.0 GHz x64 |
| **Installed RAM** | 8.00 GB DDR4 (7.77 GB Usable Physical Memory) | 8.00 GB RAM |
| **Primary Storage (OS / Dev)** | 256 GB NVMe SSD (NTFS, 174.70 GB Free space) | 20 GB Free SSD Space |
| **Secondary Storage** | 1.0 TB HDD (NTFS, 646.79 GB Free space) | Optional |
| **System Architecture** | x86_64 (64-bit operating system, x64-based processor) | 64-bit Architecture |
| **System Manufacturer / Model** | Dell Inc. (Motherboard 00JGRJ, BIOS A00) | Standard PC Workstation |

---

## 2. Software & Runtime Environment Specification

| Layer / Subsystem | Technology | Verified Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Operating System** | Microsoft Windows 11 Pro | Version 25H2 (OS Build 26100.3194) | Primary Host Execution Environment |
| **JavaScript / TypeScript Runtime** | Node.js | v26.7.0 (Active Windows Native) | Backend API & Build Pipeline Execution |
| **Package Manager** | npm | v12.0.2 | Monorepo Dependency Resolution |
| **Python Runtime** | CPython | v3.12.10 (64-bit) | AST Cyclomatic Complexity & Docx Generation |
| **Primary Persistence Datastore** | MongoDB Community Server | v7.0.14 (`rs0` Replica Set on 127.0.0.1:27017) | Multi-Document ACID Transactions & Collections |
| **In-Memory Caching & Lock Tier**| Redis Server | v8.10.1 (Native on 127.0.0.1:6379) | Sliding-Window Rate Limits & Session Store |
| **Web Browser Engine** | Microsoft EdgeCore / Chromium | v157.0.4341.60 (Headless Engine) | Browser E2E Workflows & Visual Capture |
| **Frontend Framework** | React | v19.0.0 (Vite 6.2.0 Bundler) | Responsive Client-Side Single Page Application |
| **Styling Framework** | Tailwind CSS | v4.3.3 | Responsive Component Theming & Layouts |
| **Backend API Framework** | Fastify | v5.2.0 | RFC 7807 REST API & Identity Middleware |
| **Contract & Validation Library** | TypeBox | v0.34.0 | Schema Validation Primitives & Boundary Guards |
| **Unit Testing Harness** | Vitest | v5.0.5 | Frontend Component & Backend Serialization Tests |
| **Browser Automation Harness** | Playwright Core | v1.65.1 | End-to-End User Journey Simulation |

---

## 3. Verified Network & Port Topology

```
+---------------------------------------------------------------------------------------------------+
|                                      HOST WORKSPACE (127.0.0.1)                                    |
|                                                                                                   |
|   +------------------------------------+          +-------------------------------------------+   |
|   |    FRONTEND PROXY SERVER (Port 3000)| <------> |          FASTIFY BACKEND API (Port 4000)   |   |
|   |    - production-server.mjs          |  /api/*  |          - REST Endpoints (/api/v1/*)     |   |
|   |    - Serves packages/frontend/dist |          |          - Identity, CSRF, Rate Limiter   |   |
|   +------------------------------------+          +---------------------+---------------------+   |
|                                                                         |                         |
|                                                  +----------------------+----------------------+  |
|                                                  |                                             |  |
|                                                  v                                             v  |
|                             +-----------------------------------+     +------------------------+  |
|                             |      MONGODB SERVER (Port 27017)   |     |    REDIS (Port 6379)   |  |
|                             |      - Replica Set: rs0           |     |    - Sliding Window    |  |
|                             |      - 14 Collections, 510 Posts  |     |    - Session Inboxes   |  |
|                             |      - Multi-Document ACID Txns   |     |    - Sub-1ms Latency   |  |
|                             +-----------------------------------+     +------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 4. Environment Setup & Execution Protocol

### Step 1: Start Native Redis Cache
```powershell
C:\ProgramData\chocolatey\bin\redis-server.exe --port 6379
```
*Verification*: `redis-cli.exe -p 6379 ping` -> Returns `PONG`.

### Step 2: Verify MongoDB Replica Set
```powershell
Get-Service -Name MongoDB
```
*Verification*: MongoDB runs on `127.0.0.1:27017` with replica set name `rs0`.

### Step 3: Launch Fastify Backend Service
```powershell
$env:MONGODB_URI="mongodb://127.0.0.1:27017/socialgraph?directConnection=true"
$env:REDIS_URL="redis://127.0.0.1:6379"
$env:PORT="4000"
node packages/backend/dist/index.js
```
*Verification*: `curl.exe http://127.0.0.1:4000/api/v1/health` -> Returns `status: "ok"`, Mongo latency ~2.88ms, Redis latency ~0.98ms.

### Step 4: Launch Frontend Production Single-Origin Server
```powershell
node production-server.mjs
```
*Verification*: `curl.exe http://127.0.0.1:3000/api/v1/health` -> Returns `status: "ok"`.

### Step 5: Execute Automated Browser E2E Suite
```powershell
node QA_VERIFICATION/run_verified_e2e.mjs
```
*Verification*: 5 / 5 User Journeys pass with full-resolution screenshot captures.
