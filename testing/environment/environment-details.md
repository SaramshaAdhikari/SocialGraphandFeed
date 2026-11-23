# SocialGraph — Hardware, Software & Testing Environment Details

**Date:** November 23, 2026  
**Host Architecture:** Windows x64 Workstation  

---

## 1. Hardware Specifications

- **Host Processor:** Intel(R) Core(TM) Ultra 9 185H
  - Physical Cores: 16
  - Logical Processors (Threads): 22
- **Host RAM (Memory):** 16.00 GB Physical RAM
- **Primary Storage (C: Drive):**
  - Type: High-speed NVMe Solid State Drive (SSD)
  - Total Capacity: 926.15 GB
  - Used Space: 638.83 GB
  - Available Free Space: 287.31 GB (31.0% free)
- **Network Requirements:**
  - Active outbound broadband internet connection for public HTTPS health checks and Atlas/Render communications.
  - Local loopback interfaces (`127.0.0.1`, `localhost`) for isolated inter-process test communication.
- **Server / Container Resources (Render Cloud):**
  - Free Tier Container instance (0.1 CPU, 512 MB RAM limit).
  - Hosted in AWS Singapore (`ap-southeast-1` / `singapore`).

---

## 2. Software & Tooling Versions

- **Host Operating System:** Microsoft Windows 11 Pro (Windows NT 10.0.26200.0)
- **Node.js Runtime (Local):** `v24.13.0`
- **Node.js Runtime (Container / Production):** `node:22.14.0-bookworm-slim`
- **Package Manager:** `npm 11.6.2`
- **Version Control System:** `git version 2.55.0.windows.4`
- **Python Runtime:** `Python 3.14.2`
- **Container Engine:** `Docker version 28.5.1, build e180ab8`
- **Web Browsers Installed:**
  - Google Chrome: `158.0.8127.36` (64-bit)
  - Microsoft Edge: `158.0.4370.33` (64-bit)

---

## 3. Application Stack & Framework Details

- **Frontend Stack:**
  - Framework: React `19.0.0`
  - Build Tool & Bundler: Vite `6.2.0`
  - Styling System: Tailwind CSS `4.3.3`
  - Icons: Lucide React `0.477.0`
  - Language: TypeScript `5.8.2`
  - Testing Framework: Vitest `5.0.5`
- **Backend Stack:**
  - Framework: Fastify `5.2.1`
  - Schema Validation: TypeBox `@sinclair/typebox 0.34.28` & `@fastify/type-provider-typebox 5.1.0`
  - Password Hashing: `bcryptjs 3.0.3`
  - Development Execution: `tsx 4.19.3`
  - Production Server: Custom Node.js HTTP single-origin proxy (`production-server.mjs`)
- **Database & Data Store:**
  - Primary Database: MongoDB Atlas M0 cluster (database name: `socialgraph`)
  - Database Driver: MongoDB Node Driver `6.13.0`
  - Local Test Requirement: Isolated MongoDB instance on port `27018`
- **Caching & Ephemeral Store:**
  - Cache Service: Redis Key Value (Render free plan, `maxmemoryPolicy: allkeys-lru`)
  - Redis Client: `ioredis 5.5.0`
  - Local Test Requirement: Isolated Redis instance on port `6380`

---

## 4. Production Safety & Testing Boundaries

- **Safety Policy:**
  - Live production endpoints (`https://socialgraph-feed.onrender.com`) are strictly accessed for read-only verification (healthcheck, public community listing, feed query, HTTP header audit).
  - No synthetic data injection, destructive deletion, database reset, or high-volume load hammering will be directed at the production Render instance or production Atlas cluster.
  - Destructive, negative, boundary-value, stress, and rate-limiting tests will run locally against isolated mock or ephemeral test fixtures as mandated by `test-env.ts`.
