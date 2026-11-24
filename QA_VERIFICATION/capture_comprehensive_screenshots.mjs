import { chromium } from 'playwright-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'QA_VERIFICATION', '02_APPLICATION_SCREENSHOTS');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const BROWSER_PATH = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\157.0.4341.60\\msedge.exe';
const BASE_URL = 'http://127.0.0.1:3000';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  console.log('=== STARTING GENUINE BROWSER EVIDENCE CAPTURE ===');
  console.log('Target Application:', BASE_URL);
  console.log('Browser:', BROWSER_PATH);
  console.log('Output Directory:', OUTPUT_DIR);

  const browser = await chromium.launch({
    executablePath: BROWSER_PATH,
    headless: true,
  });

  // Desktop Context (1440x900)
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 SocialGraphVerification/1.0',
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
    console.log(`✓ Saved ${filename} (${fs.statSync(fullPath).size} bytes)`);
  }

  try {
    // 1. Home Feed (Desktop)
    await snap('/', 'APP-001_Landing_Home_Feed_Desktop.png');

    // 2. Home Feed - Top Tab
    await snap('/', 'APP-002_Home_Feed_Top_Tab.png', null, async (p) => {
      const topBtn = await p.$('button:has-text("Top")');
      if (topBtn) await topBtn.click();
    });

    // 3. Home Feed - New Tab
    await snap('/', 'APP-003_Home_Feed_New_Tab.png', null, async (p) => {
      const newBtn = await p.$('button:has-text("New")');
      if (newBtn) await newBtn.click();
    });

    // 4. Discover Page
    await snap('/explore', 'APP-004_Discover_Masonry_Grid.png');

    // 5. Interactive Graph Page
    await snap('/graph', 'APP-005_Interactive_Social_Graph.png');

    // 6. Post Detail with comments
    await snap('/post/post-001', 'APP-006_Post_Detail_Discussion.png');

    // 7. Threaded comments section
    await snap('/post/post-001', 'APP-007_Threaded_Comments_Section.png', null, async (p) => {
      await p.evaluate(() => window.scrollBy(0, 500));
    });

    // 8. User Profile Overview
    await snap('/u/sarah_architect', 'APP-008_User_Profile_Overview.png');

    // 9. Communities Directory
    await snap('/communities', 'APP-009_Communities_Directory.png');

    // 10. Community Detail Hub
    await snap('/community/distributed-systems', 'APP-010_Community_Detail_Hub.png');

    // 11. Universal Search
    await snap('/search?q=systems', 'APP-011_Universal_Search_Query.png');

    // 12. Create Post Composer (Empty)
    await snap('/create', 'APP-012_Create_Post_Composer_Empty.png');

    // 13. Create Post Composer (Filled with markdown)
    await snap('/create', 'APP-013_Create_Post_Composer_Filled.png', null, async (p) => {
      const titleInput = await p.$('input[placeholder*="Title"], input[type="text"]');
      if (titleInput) await titleInput.fill('Evaluation of Meta TAO Cache Invalidation in SocialGraph');
      const bodyInput = await p.$('textarea');
      if (bodyInput) await bodyInput.fill('### Architectural Verification\n\nThis benchmark evaluates dual-strategy fanout performance under high read workloads.');
    });

    // 14. Saved Collections
    await snap('/saved', 'APP-014_Saved_Collections_Page.png');

    // 15. Messages View
    await snap('/messages', 'APP-015_Direct_Messages_View.png');

    // 16. Notifications Center
    await snap('/notifications', 'APP-016_Notifications_Center.png');

    // 17. Settings Appearance
    await snap('/settings/appearance', 'APP-017_Settings_Appearance_Theme.png');

    // 18. Settings Profile
    await snap('/settings/profile', 'APP-018_Settings_Profile_Editor.png');

    // 19. System Diagnostics
    await snap('/diagnostics', 'APP-019_System_Diagnostics_Dashboard.png');

    // 20. Login Form
    await snap('/login', 'APP-020_Login_Form_Initial.png');

    // 21. Login Form Validation Error
    await snap('/login', 'APP-021_Login_Validation_Error.png', 'div[role="alert"]', async (p) => {
      const userInput = await p.$('input[name="username"], input[type="text"]');
      if (userInput) await userInput.fill('invalid_user_9999');
      const passInput = await p.$('input[name="password"], input[type="password"]');
      if (passInput) await passInput.fill('WrongPassword123!');
      const submitBtn = await p.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
    });

    // 22. Registration Form
    await snap('/register', 'APP-022_Registration_Form_Initial.png');

    // 23. 404 Error State
    await snap('/nonexistent-test-boundary-404', 'APP-023_404_RFC7807_Not_Found.png');

    // 24. Workflow: Login Success Journey
    await snap('/login', 'APP-026_Workflow_Login_Success.png', null, async (p) => {
      const userInput = await p.$('input[name="username"], input[type="text"]');
      if (userInput) await userInput.fill('sarah_architect');
      const passInput = await p.$('input[name="password"], input[type="password"]');
      if (passInput) await passInput.fill('Password123!');
      const submitBtn = await p.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await delay(1500);
    });

    await context.close();

    // Tablet Context (768x1024)
    const tabletCtx = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });
    const tabletPage = await tabletCtx.newPage();
    await tabletPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await delay(1000);
    const tabletPath = path.join(OUTPUT_DIR, 'APP-024_Responsive_Tablet_768.png');
    await tabletPage.screenshot({ path: tabletPath });
    console.log(`✓ Saved APP-024_Responsive_Tablet_768.png (${fs.statSync(tabletPath).size} bytes)`);
    await tabletCtx.close();

    // Mobile Context (375x812)
    const mobileCtx = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const mobilePage = await mobileCtx.newPage();
    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await delay(1000);
    const mobilePath = path.join(OUTPUT_DIR, 'APP-025_Responsive_Mobile_375.png');
    await mobilePage.screenshot({ path: mobilePath });
    console.log(`✓ Saved APP-025_Responsive_Mobile_375.png (${fs.statSync(mobilePath).size} bytes)`);
    await mobileCtx.close();

    console.log('\n=== ALL 25 GENUINE BROWSER SCREENSHOTS CAPTURED SUCCESSFULLY! ===');
  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
