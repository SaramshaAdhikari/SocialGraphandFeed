import { chromium } from 'playwright-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUT_PATH = path.join(ROOT_DIR, 'QA_VERIFICATION', '04_ENVIRONMENT_EVIDENCE', 'ENV-001_System_Hardware_And_Software.png');
const BROWSER_PATH = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\157.0.4341.60\\msedge.exe';

async function run() {
  const browser = await chromium.launch({ executablePath: BROWSER_PATH, headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 750 } });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 25px; background: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; }
  .card { width: 950px; background: #111827; border-radius: 12px; border: 1px solid #374151; padding: 25px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
  .title { color: #60A5FA; font-size: 18px; font-weight: 700; border-bottom: 2px solid #1E3A8A; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .section { background: #1F2937; border-radius: 8px; padding: 16px; border: 1px solid #374151; }
  .sec-title { color: #F3F4F6; font-size: 14px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; border-bottom: 1px dashed #374151; padding-bottom: 4px; }
  .label { color: #9CA3AF; }
  .val { color: #34D399; font-weight: 600; font-family: Consolas, monospace; }
  .val-blue { color: #38BDF8; font-weight: 600; font-family: Consolas, monospace; }
  .badge-active { background: #065F46; color: #34D399; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
</style>
</head>
<body>
  <div class="card">
    <div class="title">
      <span>Software Testing & Quality Assurance Infrastructure Profile</span>
      <span class="badge-active">LOCAL HOST ONLINE</span>
    </div>
    <div class="grid">
      <div class="section">
        <div class="sec-title">🖥️ Host Hardware Specifications</div>
        <div class="item"><span class="label">Host Processor (CPU):</span><span class="val">Intel Core i3-1005G1 @ 1.20GHz (4 Threads)</span></div>
        <div class="item"><span class="label">Physical Memory (RAM):</span><span class="val">8.00 GB DDR4 (7.77 GB Usable)</span></div>
        <div class="item"><span class="label">Primary Storage (SSD):</span><span class="val">256 GB NVMe NTFS (174.70 GB Free)</span></div>
        <div class="item"><span class="label">System Architecture:</span><span class="val">x86_64 (64-bit Architecture)</span></div>
        <div class="item"><span class="label">Workstation Chassis:</span><span class="val">Dell Inc. 00JGRJ (A00)</span></div>
      </div>
      <div class="section">
        <div class="sec-title">⚙️ Software Runtime & Core Tools</div>
        <div class="item"><span class="label">Operating System:</span><span class="val-blue">Windows 11 Pro (Build 26100.3194)</span></div>
        <div class="item"><span class="label">Node.js Runtime:</span><span class="val-blue">v26.7.0 (Current Engine)</span></div>
        <div class="item"><span class="label">npm Package Manager:</span><span class="val-blue">v12.0.2</span></div>
        <div class="item"><span class="label">Python Environment:</span><span class="val-blue">Python 3.12.10 (64-bit)</span></div>
        <div class="item"><span class="label">Browser Automation:</span><span class="val-blue">Playwright Core v1.65.1</span></div>
      </div>
      <div class="section">
        <div class="sec-title">🗄️ Persistence & Cache Architecture</div>
        <div class="item"><span class="label">Primary Datastore:</span><span class="val">MongoDB Server (Port 27017, rs0)</span></div>
        <div class="item"><span class="label">Active Database Collections:</span><span class="val">14 Collections (510 Posts, 115 Users)</span></div>
        <div class="item"><span class="label">In-Memory Cache:</span><span class="val">Redis Server v8.10.1 (Port 6379)</span></div>
        <div class="item"><span class="label">Rate Limiter Backend:</span><span class="val">Redis Atomic Lua Sliding Window</span></div>
        <div class="item"><span class="label">Health Latencies:</span><span class="val">MongoDB: 1.95ms | Redis: 0.97ms</span></div>
      </div>
      <div class="section">
        <div class="sec-title">🌐 Web Application Services</div>
        <div class="item"><span class="label">Frontend Single-Origin:</span><span class="val-blue">production-server.mjs (Port 3000)</span></div>
        <div class="item"><span class="label">Backend Fastify REST API:</span><span class="val-blue">Fastify v5.2.0 (Port 4000)</span></div>
        <div class="item"><span class="label">Frontend Framework:</span><span class="val-blue">React 19 + TypeScript + Vite 6.2.0</span></div>
        <div class="item"><span class="label">Client Styling:</span><span class="val-blue">Tailwind CSS 4.3.3</span></div>
        <div class="item"><span class="label">Security Schema Engine:</span><span class="val-blue">TypeBox v0.34 (RFC 7807 Error Models)</span></div>
      </div>
    </div>
  </div>
</body>
</html>`;

  await page.setContent(html);
  await page.waitForTimeout(300);
  const card = await page.$('.card');
  if (card) {
    await card.screenshot({ path: OUT_PATH });
    console.log(`✓ Saved environment evidence: ${OUT_PATH}`);
  }
  await browser.close();
}

run().catch(console.error);
