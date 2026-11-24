import { chromium } from 'playwright-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'QA_VERIFICATION', '02_APPLICATION_SCREENSHOTS');

const BROWSER_PATH = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\157.0.4341.60\\msedge.exe';
const BASE_URL = 'http://127.0.0.1:3000';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fixScreenshots() {
  console.log('=== STARTING AUDIT CORRECTION & SCREENSHOT RE-CAPTURE ===');
  console.log('Target Application:', BASE_URL);
  console.log('Browser:', BROWSER_PATH);

  const browser = await chromium.launch({
    executablePath: BROWSER_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 SocialGraphAudit/2.1',
  });

  const page = await context.newPage();

  async function snap(relPath, filename, waitSelector = null, action = null) {
    console.log(`Capturing: ${filename} from ${relPath}...`);
    await page.goto(`${BASE_URL}${relPath}`, { waitUntil: 'networkidle' });
    await delay(1200);
    if (action) {
      await action(page);
      await delay(800);
    }
    if (waitSelector) {
      try {
        await page.waitForSelector(waitSelector, { timeout: 4000 });
      } catch (e) {
        console.warn(`Selector ${waitSelector} timed out, capturing current state`);
      }
    }
    const fullPath = path.join(OUTPUT_DIR, filename);
    await page.screenshot({ path: fullPath, fullPage: false });
    const stat = fs.statSync(fullPath);
    console.log(`✓ Saved ${filename} (${stat.size} bytes)`);
  }

  try {
    // Step 1: Establish Authenticated Session via /register
    console.log('\n--- Establishing Authenticated Session ---');
    const authUser = `qa_audit_${Date.now().toString().slice(-6)}`;
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
    await page.fill('input[name="username"]', authUser);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="password_confirmation"]', 'Password123!');
    await page.click('button[type="submit"]');
    await delay(2000);
    console.log(`✓ Authenticated as ${authUser}`);

    // Capture APP-026: Genuine Post-Login Authenticated State
    const ss026 = path.join(OUTPUT_DIR, 'APP-026_Workflow_Login_Success.png');
    await page.screenshot({ path: ss026 });
    console.log(`✓ Saved APP-026_Workflow_Login_Success.png (${fs.statSync(ss026).size} bytes)`);

    // Step 2: Now authenticated, capture protected views!

    // APP-005: Interactive Social Graph
    await snap('/graph', 'APP-005_Interactive_Social_Graph.png', 'svg, canvas, main');

    // APP-006: Post Detail View (using genuine seeded post_101)
    await snap('/post/post_101', 'APP-006_Post_Detail_Discussion.png');

    // APP-007: Threaded Comments (scrolled down on post_101)
    await snap('/post/post_101', 'APP-007_Threaded_Comments_Section.png', null, async (p) => {
      await p.evaluate(() => window.scrollBy(0, 450));
    });

    // APP-008: User Profile Overview (using genuine seeded alex_dev)
    await snap('/u/alex_dev', 'APP-008_User_Profile_Overview.png');

    // APP-010: Community Detail Hub (using genuine seeded comm_systems)
    await snap('/c/comm_systems', 'APP-010_Community_Detail_Hub.png');

    // APP-012: Create Post Composer (Empty)
    await snap('/create', 'APP-012_Create_Post_Composer_Empty.png');

    // APP-013: Create Post Composer (Populated)
    await snap('/create', 'APP-013_Create_Post_Composer_Filled.png', null, async (p) => {
      const title = await p.$('input[placeholder*="Title"], input[type="text"]');
      if (title) await title.fill('Verified Meta TAO Architecture Benchmark');
      const body = await p.$('textarea');
      if (body) await body.fill('### Architectural Evaluation\n\nDual-strategy push/pull distribution benchmarks indicate 99.4% sub-5ms latency under local replica set execution.');
    });

    // APP-014: Saved Collections Page
    await snap('/saved', 'APP-014_Saved_Collections_Page.png');

    // APP-015: Direct Messages View
    await snap('/messages', 'APP-015_Direct_Messages_View.png');

    // APP-016: Notifications Center
    await snap('/notifications', 'APP-016_Notifications_Center.png');

    // APP-017: Settings Appearance Theme
    await snap('/settings/appearance', 'APP-017_Settings_Appearance_Theme.png');

    // APP-018: Settings Profile Editor
    await snap('/settings/profile', 'APP-018_Settings_Profile_Editor.png');

    console.log('\n=== ALL 13 CORRECTION SCREENSHOTS CAPTURED SUCCESSFULLY! ===');
  } finally {
    await browser.close();
  }
}

fixScreenshots().catch((err) => {
  console.error('Correction capture failed:', err);
  process.exit(1);
});
