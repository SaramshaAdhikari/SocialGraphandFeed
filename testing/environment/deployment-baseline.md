# SocialGraph — Deployment Baseline & Version Audit

**Date of Audit:** November 23, 2026  
**Auditor:** Software Testing & Quality Assurance Agent  
**Status:** Baseline Established & Formally Verified  

---

## 1. Official Repository & Deployment Platform

- **Repository URL:** `https://github.com/SaramshaAdhikari/SocialGraphandFeed`
- **Deployment Platform:** Render Cloud (Web Service + Render Key Value Redis)
- **Deployment Configuration File:** `render.yaml` (Render Blueprint)
- **Deployment Web Origin / URL:** `https://socialgraph-feed.onrender.com`
- **Live Health Endpoint:** `https://socialgraph-feed.onrender.com/api/v1/health`
- **Target Deployment Region:** Singapore (`singapore`)
- **Hosting Plan:** Free Tier

---

## 2. Exact Deployed Commit Identification & Cryptographic Verification

- **Deployed Branch:** `main` (tracked via `autoDeploy: true` on Render)
- **Deployed Commit SHA:** `94540883ab99b8862ac995fa9afebc2e9eadaa16`
- **Tree SHA:** `9587ff848cf820bdba3febfc03016b6ae3e323ef`
- **Commit Author:** Nishot <nishottimal11@gmail.com>
- **Commit Date:** Sat Oct 31 13:23:58 2026 +0530
- **Commit Message:** `Revert temporary startup seed`

### Relationship to Reference Commit
- **Reference Commit Mentioned in Brief:** `3e8e1aff3a71be9142c95f395eed31471997f302` ("fix(posts): resolve publishing serialization failures and prevent duplicate submissions", Oct 22, 2026)
- **Verification:** Commit `3e8e1af` is a direct historical ancestor of `9454088`. Subsequent PRs and features (including real-time updates, graph modernization, neutral dark theme, Render deployment configuration `2624aa3`, and startup seed adjustments `f53bdde`) were merged into `main`, culminating in commit `9454088`.

### Asset Hash Verification (Proof of Deployed State)
A clean build of the frontend package was executed against commit `94540883ab99b8862ac995fa9afebc2e9eadaa16`. The resulting asset filenames and bundle hashes:
- Built JavaScript Bundle: `dist/assets/index-DOLbJbWo.js` (723.92 kB)
- Built CSS Bundle: `dist/assets/index-BHjLuT0c.css` (98.38 kB)
- Live Production HTML (`https://socialgraph-feed.onrender.com/`):
  ```html
  <script type="module" crossorigin src="/assets/index-DOLbJbWo.js"></script>
  <link rel="stylesheet" crossorigin href="/assets/index-BHjLuT0c.css">
  ```
The bundle hashes match 100% identically, verifying that the deployed cloud instance corresponds to commit `94540883ab99b8862ac995fa9afebc2e9eadaa16`.

---

## 3. Workspace Isolation & Integrity

1. **Original Development Workspace:**
   - Path: `C:\Users\saram\Projects\SocialGraphandFeedEngineering`
   - Git Status: On branch `main`, commit `8780464` ("security: harden application boundaries and enforce security contract"). Clean working tree.
   - State: Preserved without any modification, checkout, or reset.
2. **Dedicated Testing Workspace:**
   - Path: `C:\Users\saram\Projects\SocialGraphandFeed_Testing`
   - Git Status: On branch `main`, commit `94540883ab99b8862ac995fa9afebc2e9eadaa16`. Clean working tree.
   - Purpose: Isolated test execution, instrumentation, coverage collection, and evidence archiving.

---

## 4. Live Health & Service Verification

Query to `GET https://socialgraph-feed.onrender.com/api/v1/health`:
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
rndr-id: add26d53-2b91-47e7
x-render-origin-server: Render
```
Payload:
```json
{
  "status": "ok",
  "timestamp": "2026-11-23T13:43:35.716Z",
  "uptime_seconds": 16,
  "version": "0.1.0",
  "services": {
    "mongodb": { "status": "connected", "latency_ms": 1.38 },
    "redis": { "status": "connected", "latency_ms": 0.94 }
  }
}
```
All production backing services (MongoDB Atlas and Render Key Value Redis) are operational and connected.
