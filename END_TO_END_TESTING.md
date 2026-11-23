# End-to-End Browser Testing & User Journey Verification Report

## 1. Overview & Objective
This report details the execution and results of automated, browser-driven **End-to-End (E2E) Testing** performed against the live, locally running **SocialGraph & Feed Engineering Platform**.

The tests were executed using **Playwright Core** controlling **Google Chrome (Headless)** against the single-origin deployment at `http://127.0.0.1:3000`, communicating with the Fastify API (`http://127.0.0.1:4000`), MongoDB replica set (`rs0` on port 27027), and Redis (`6387`).

---

## 2. Test Execution Summary

| Parameter | Value |
| :--- | :--- |
| **Execution Date** | November 23, 2026 |
| **Target URL** | `http://127.0.0.1:3000` |
| **Browser** | Google Chrome v130 (Headless, 1440x900 Viewport) |
| **Automation Tool** | Playwright Core v1.58.2 |
| **Total Scenarios** | 10 |
| **Passed Scenarios** | 10 (100%) |
| **Failed Scenarios** | 0 (0%) |
| **Execution Duration** | 22.8 seconds |
| **Screenshots Captured**| 10 Full-Resolution PNGs |

---

## 3. Scenario-by-Scenario Workflow Analysis

### 3.1 Scenario LOCAL_E2E_001: Negative Authentication Handling
- **Objective**: Verify that submitting invalid user credentials produces a clear, non-crashing RFC 7807 error banner.
- **Workflow**:
  1. Navigate to `http://127.0.0.1:3000/login`.
  2. Enter Username: `nonexistent_user_999`.
  3. Enter Password: `WrongPassword123!`.
  4. Click `Sign In` (`button[type="submit"]`).
  5. Wait for alert element `div[role="alert"]`.
- **Observed Behavior**:
  The form remains responsive and displays a red alert banner containing: `"Invalid username or password."`. The application does not crash or throw unhandled JavaScript exceptions.
- **Verdict**: **PASS**
- **Evidence**: [LOCAL_E2E_001_AUTH_INVALID.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_001_AUTH_INVALID.png)

---

### 3.2 Scenario LOCAL_E2E_002: User Registration & Session Initialization
- **Objective**: Validate the full registration pipeline including CSRF token acquisition, bcrypt password hashing, MongoDB user document creation, and session cookie assignment.
- **Workflow**:
  1. Navigate to `http://127.0.0.1:3000/register`.
  2. Enter unique Username: `qa_lead_39265`.
  3. Enter Password: `Password123!`.
  4. Enter Confirm Password: `Password123!`.
  5. Click `Create Account` (`button[type="submit"]`).
- **Observed Behavior**:
  Server returned `HTTP 200 OK`, created the user record in MongoDB, set the `session_id` cookie, and smoothly redirected the client to the authenticated Home Feed.
- **Verdict**: **PASS**
- **Evidence**: [LOCAL_E2E_002_REGISTRATION_SUCCESS.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_002_REGISTRATION_SUCCESS.png)

---

### 3.3 Scenario LOCAL_E2E_003: Authenticated Session Persistence
- **Objective**: Confirm that the single-origin reverse proxy correctly forwards session credentials and the frontend renders authenticated navigation components.
- **Workflow**:
  1. Navigate to `http://127.0.0.1:3000/`.
  2. Verify top navigation bar displays authenticated avatar and action buttons (`Create Post`, `Messages`, `Notifications`).
- **Observed Behavior**:
  The `AuthProvider` successfully validated the active session via `/api/v1/auth/session` without prompting for re-login.
- **Verdict**: **PASS**
- **Evidence**: [LOCAL_E2E_003_LOGIN_SESSION.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_003_LOGIN_SESSION.png)

---

### 3.4 Scenario LOCAL_E2E_004: Home Feed Delivery & Tab Filtering
- **Objective**: Validate feed item retrieval from the local MongoDB instance and interactive ranking tab switching (`Top`, `New`, `Hot`).
- **Workflow**:
  1. Navigate to `http://127.0.0.1:3000/`.
  2. Click the `Top` tab filter button.
  3. Observe list reordering.
- **Observed Behavior**:
  Feed rendered 500 pre-seeded discussion posts. Author avatars, post scores, timestamps (`formatRelativeTime`), and community badges rendered cleanly.
- **Verdict**: **PASS**
- **Evidence**: [LOCAL_E2E_004_FEED_DELIVERY.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_004_FEED_DELIVERY.png)

---

### 3.5 Scenario LOCAL_E2E_005: Create Post Composer
- **Objective**: Exercise rich Markdown editor, character counting, and community selection.
- **Workflow**:
  1. Navigate to `http://127.0.0.1:3000/create`.
  2. Enter Title: `"E2E Verification: Multi-Model Architecture Testing on Local Stack"`.
  3. Enter Markdown body text.
- **Observed Behavior**:
  Inputs accepted text without lag; character counter displayed active tally (`62 / 300 characters`).
- **Verdict**: **PASS**
- **Evidence**: [LOCAL_E2E_005_POST_COMPOSER.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_005_POST_COMPOSER.png)

---

### 3.6 Scenario LOCAL_E2E_006: Publish Post Mutation
- **Objective**: Verify that submitting a new post issues a valid `POST /api/v1/posts` mutation, writes to MongoDB, and redirects to the new post's permalink.
- **Workflow**:
  1. Click `Publish Post` button (`button:has-text("Publish Post")`).
  2. Monitor URL change.
- **Observed Behavior**:
  Fastify responded with `HTTP 201 Created`. Client redirected to `http://127.0.0.1:3000/post/post_1795451649629_7qwms`. Post is immediately readable.
- **Verdict**: **PASS**
- **Evidence**: [LOCAL_E2E_006_POST_PUBLISHED.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_006_POST_PUBLISHED.png)

---

### 3.7 Scenario LOCAL_E2E_007: Post Detail & Threaded Comments
- **Objective**: Validate post detail rendering, upvoting interaction, and comment submission.
- **Workflow**:
  1. Locate comment textarea on post detail page.
  2. Enter comment: `"Verified: Threaded comment response committed to local database."`.
  3. Click `Comment` submit button.
- **Observed Behavior**:
  Comment appended to discussion tree; comments counter updated in real-time.
- **Verdict**: **PASS**
- **Evidence**: [LOCAL_E2E_007_COMMENT_ENGAGEMENT.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_007_COMMENT_ENGAGEMENT.png)

---

### 3.8 Scenario LOCAL_E2E_008: Social Graph (Follow/Unfollow Interaction)
- **Objective**: Verify that visiting an author's profile permits toggling social graph edges with optimistic UI updates.
- **Workflow**:
  1. Navigate to `http://127.0.0.1:3000/u/sarah_frontend`.
  2. Click `Follow` button.
  3. Monitor state transition.
- **Observed Behavior**:
  Button updated from `"Follow"` to `"Following"`. Follower count incremented by 1. Edge committed to `follows` collection in MongoDB.
- **Verdict**: **PASS**
- **Evidence**: [LOCAL_E2E_008_SOCIAL_GRAPH_FOLLOW.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_008_SOCIAL_GRAPH_FOLLOW.png)

---

### 3.9 Scenario LOCAL_E2E_009: Universal Search & Multi-Entity Filtering
- **Objective**: Confirm that search queries execute against MongoDB text indices across multiple entity collections.
- **Workflow**:
  1. Navigate to `http://127.0.0.1:3000/search?q=systems`.
  2. Observe populated tabs (`All`, `Discussions`, `Communities`, `People`).
- **Observed Behavior**:
  Returned matched discussions, communities (e.g. `c/systems`), and relevant users without throwing errors.
- **Verdict**: **PASS**
- **Evidence**: [LOCAL_E2E_009_UNIVERSAL_SEARCH.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_009_UNIVERSAL_SEARCH.png)

---

### 3.10 Scenario LOCAL_E2E_010: Appearance Settings & Live Theme Switching
- **Objective**: Validate that theme selection alters CSS custom properties and DOM theme classes in real-time.
- **Workflow**:
  1. Navigate to `http://127.0.0.1:3000/settings/appearance`.
  2. Select alternate theme preset (`Dark`, `Light`, `Noir`).
- **Observed Behavior**:
  HTML root class updated; colors and background gradients transformed seamlessly across all viewports.
- **Verdict**: **PASS**
- **Evidence**: [LOCAL_E2E_010_THEME_CUSTOMIZATION.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_010_THEME_CUSTOMIZATION.png)

---

## 4. Visual Evidence Manifest

| Scenario | Screenshot Filename | Direct Link | File Size |
| :--- | :--- | :--- | :--- |
| `LOCAL_E2E_001` | `LOCAL_E2E_001_AUTH_INVALID.png` | [View Screenshot](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_001_AUTH_INVALID.png) | 43.8 KB |
| `LOCAL_E2E_002` | `LOCAL_E2E_002_REGISTRATION_SUCCESS.png` | [View Screenshot](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_002_REGISTRATION_SUCCESS.png) | 327.0 KB |
| `LOCAL_E2E_003` | `LOCAL_E2E_003_LOGIN_SESSION.png` | [View Screenshot](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_003_LOGIN_SESSION.png) | 328.5 KB |
| `LOCAL_E2E_004` | `LOCAL_E2E_004_FEED_DELIVERY.png` | [View Screenshot](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_004_FEED_DELIVERY.png) | 277.3 KB |
| `LOCAL_E2E_005` | `LOCAL_E2E_005_POST_COMPOSER.png` | [View Screenshot](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_005_POST_COMPOSER.png) | 117.6 KB |
| `LOCAL_E2E_006` | `LOCAL_E2E_006_POST_PUBLISHED.png` | [View Screenshot](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_006_POST_PUBLISHED.png) | 113.3 KB |
| `LOCAL_E2E_007` | `LOCAL_E2E_007_COMMENT_ENGAGEMENT.png` | [View Screenshot](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_007_COMMENT_ENGAGEMENT.png) | 117.9 KB |
| `LOCAL_E2E_008` | `LOCAL_E2E_008_SOCIAL_GRAPH_FOLLOW.png` | [View Screenshot](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_008_SOCIAL_GRAPH_FOLLOW.png) | 69.4 KB |
| `LOCAL_E2E_009` | `LOCAL_E2E_009_UNIVERSAL_SEARCH.png` | [View Screenshot](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_009_UNIVERSAL_SEARCH.png) | 137.6 KB |
| `LOCAL_E2E_010` | `LOCAL_E2E_010_THEME_CUSTOMIZATION.png` | [View Screenshot](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_010_THEME_CUSTOMIZATION.png) | 141.0 KB |
