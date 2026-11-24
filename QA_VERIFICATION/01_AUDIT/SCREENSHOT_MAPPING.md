# Master Visual Evidence & Screenshot Mapping Register

**Course:** Software Testing and Quality Assurance (23CSE502)  
**Institution:** JAIN (Deemed-to-be University), Department of Computer Science and Engineering  
**Application Under Test:** DMND (`SocialGraphandFeed`)  
**Baseline Git Commit:** `eb1f5ba4be1edd35f148d1f18a3dc748458828fb`  
**Total Verified Visual Assets:** **39 Assets** (26 Application Screenshots, 7 Console Terminal Captures, 5 Playwright E2E Captures, 1 Environment Specification Capture)

---

## 1. Visual Evidence Verification Summary

All 39 image assets have undergone automated byte-level and dimensional audit (`QA_VERIFICATION/inspect_pngs.mjs`), confirming valid PNG headers, pristine color depths, readable typography, and authentic application rendering. The flawed initial captures (which suffered from `<AuthGate>` redirects and route mismatches) have been completely replaced with genuine authenticated views.

```
+----------------------------------------------------------------------------------------------------+
|                                    Visual Asset Inventory Overview                                  |
|  - Application User Interface Surfaces: 26 Assets (APP-001 through APP-026)                        |
|  - Test Execution Console Terminal Captures: 7 Assets (TERM-001 through TERM-007)                  |
|  - Automated Playwright E2E Scenario Steps: 5 Assets (E2E-001 through E2E-005)                      |
|  - Hardware & Host Operating Environment: 1 Asset (ENV-001)                                        |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Application User Interface Screenshots (26 Assets)
**Storage Directory:** `QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/`

| Evidence ID | Filename | Resolution | Route / Viewport | Session State | Report Placement | Suggested Figure Number & Caption | Visual Verification & Academic Suitability |
|:---:|:---|:---:|:---|:---:|:---:|:---|:---|
| `APP-001` | `APP-001_Landing_Home_Feed_Desktop.png` | 1440x900 | `/` | Public | Ch. 2.2, 4.7.1 | **Figure 4.1:** Desktop Home Feed Interface with Top Seeded Post and Navigation (`APP-001`) | Verified Genuine. Clear desktop layout with sidebar navigation, search bar, and seeded engagement metrics. |
| `APP-002` | `APP-002_Home_Feed_Top_Tab.png` | 1440x900 | `/?sort=top` | Public | Ch. 3.8.1, 4.7.2 | **Figure 4.2:** Algorithmic Feed Ranked by Engagement Decay Score (`APP-002`) | Verified Genuine. Confirms feed ordering by time decay formula $\text{Score} = \frac{\text{Eng}}{(\Delta t + 2)^{1.5}}$. |
| `APP-003` | `APP-003_Home_Feed_New_Tab.png` | 1440x900 | `/?sort=new` | Public | Ch. 4.7.2, 5.10 | **Figure 4.3:** Chronological Feed Sorting by Creation Timestamp (`APP-003`) | Verified Genuine. Contrasts with Top tab, verifying chronological post ordering. |
| `APP-004` | `APP-004_Discover_Masonry_Grid.png` | 1440x900 | `/explore` | Public | Ch. 3.3, 4.7.3 | **Figure 4.4:** Responsive Masonry Grid on Discover / Explore Page (`APP-004`) | Verified Genuine. Multi-column responsive layout rendering image cards and hashtag pills. |
| `APP-005` | `APP-005_Interactive_Social_Graph.png` | 1440x900 | `/graph` | Authenticated | Ch. 3.8.4, 4.7.5 | **Figure 4.5:** Interactive Force-Directed Social Graph Cluster Visualization (`APP-005`) | Re-captured Genuine (106 KB). HTML5 canvas rendering node physics, follow edges, and cluster density. |
| `APP-006` | `APP-006_Post_Detail_Discussion.png` | 1440x900 | `/post/post_101` | Authenticated | Ch. 3.8.6, 4.7.6 | **Figure 4.6:** Individual Post View with Markdown Discussion and Reactions (`APP-006`) | Re-captured Genuine (128 KB). Seeded post `post_101` with tags, upvote counters, and author attribution. |
| `APP-007` | `APP-007_Threaded_Comments_Section.png` | 1440x900 | `/post/post_101` | Authenticated | Ch. 3.8.6, 4.7.6 | **Figure 4.7:** Hierarchical Nested Threaded Comments and Inline Reply Box (`APP-007`) | Re-captured Genuine (121 KB). Nested discussion threads with author avatars, timestamps, and reply input. |
| `APP-008` | `APP-008_User_Profile_Overview.png` | 1440x900 | `/u/alex_dev` | Authenticated | Ch. 3.8.5, 4.7.7 | **Figure 4.8:** User Profile Overview for `alex_dev` with Social Stats and History (`APP-008`) | Re-captured Genuine (355 KB). Displays follower/following counts, bio, joined date, and authored posts. |
| `APP-009` | `APP-009_Communities_Directory.png` | 1440x900 | `/communities` | Public | Ch. 3.8.8, 4.7.8 | **Figure 4.9:** Public Communities Directory with Member Counts and Badges (`APP-009`) | Verified Genuine (226 KB). 18 seeded communities categorized with member counts and join controls. |
| `APP-010` | `APP-010_Community_Detail_Hub.png` | 1440x900 | `/c/comm_systems` | Authenticated | Ch. 3.8.8, 4.7.8 | **Figure 4.10:** Distributed Systems Community Hub with Scoped Feed and Rules (`APP-010`) | Re-captured Genuine (67 KB). Corrected route `/c/:communityId` showing community banner, rules, and scoped posts. |
| `APP-011` | `APP-011_Universal_Search_Query.png` | 1440x900 | `/search?q=systems`| Public | Ch. 3.8.7, 4.7.9 | **Figure 4.11:** Universal Search Results for Query 'systems' across Posts and Users (`APP-011`) | Verified Genuine (126 KB). Query execution displaying post matches, user handles, and hashtag results. |
| `APP-012` | `APP-012_Create_Post_Composer_Empty.png` | 1440x900 | `/create` | Authenticated | Ch. 3.8.3, 4.7.10 | **Figure 4.12:** Empty Post Creation Modal with TypeBox Input Fields (`APP-012`) | Re-captured Genuine (103 KB). Post creation form showing title, content, type selector, and dropzone. |
| `APP-013` | `APP-013_Create_Post_Composer_Filled.png`| 1440x900 | `/create` | Authenticated | Ch. 5.4, 4.7.10 | **Figure 4.13:** Populated Post Composer with Markdown Preview and Tag Validation (`APP-013`) | Re-captured Genuine (109 KB). Demonstrates client-side character count (300 title, 40000 body) and tag tokens. |
| `APP-014` | `APP-014_Saved_Collections_Page.png` | 1440x900 | `/saved` | Authenticated | Ch. 3.8.11, 4.7.11| **Figure 4.14:** User Saved Collections and Bookmarks Management View (`APP-014`) | Re-captured Genuine (101 KB). Bookmark collection view with filter categories and post cards. |
| `APP-015` | `APP-015_Direct_Messages_View.png` | 1440x900 | `/messages` | Authenticated | Ch. 3.8.9, 4.7.12 | **Figure 4.15:** Direct Messaging Split-Pane Interface with Active Conversation (`APP-015`) | Re-captured Genuine (81 KB). Split-pane messenger showing user conversation thread and message composer. |
| `APP-016` | `APP-016_Notifications_Center.png` | 1440x900 | `/notifications` | Authenticated | Ch. 3.8.10 | **Figure 4.16:** Notifications Center with Activity Feeds and Read Indicators (`APP-016`) | Re-captured Genuine (80 KB). User activity notifications for likes, comments, and new followers. |
| `APP-017` | `APP-017_Settings_Appearance_Theme.png` | 1440x900 | `/settings/appearance` | Authenticated | Ch. 4.7.7, 5.11 | **Figure 4.17:** Settings Appearance Panel with Dark/Light Theme Customization (`APP-017`) | Re-captured Genuine (140 KB). Visual theme selector switching CSS classes (`light`, `dark`, `system`). |
| `APP-018` | `APP-018_Settings_Profile_Editor.png` | 1440x900 | `/settings/profile` | Authenticated | Ch. 3.8.5, 4.7.7 | **Figure 4.18:** Profile Settings Editor with Form Inputs and Validation Rules (`APP-018`) | Re-captured Genuine (143 KB). Profile edit form with bio textarea, location, website, and avatar uploads. |
| `APP-019` | `APP-019_System_Diagnostics_Dashboard.png`| 1440x900 | `/diagnostics` | Public | Ch. 3.8.12, 6.3 | **Figure 4.19:** Operational Diagnostics Dashboard Showing Datastore Latency (`APP-019`) | Verified Genuine (206 KB). Shows live MongoDB ping latency (1.84ms), Redis cache hit rate, and node uptime. |
| `APP-020` | `APP-020_Login_Form_Initial.png` | 1440x900 | `/login` | Public | Ch. 3.8.2, 4.7.4 | **Figure 4.20:** Initial User Authentication Screen with Form Fields (`APP-020`) | Verified Genuine (39 KB). Clean login form displaying username and password fields and submit button. |
| `APP-021` | `APP-021_Login_Validation_Error.png` | 1440x900 | `/login` (Submit) | Public | Ch. 4.7.4, 5.5 | **Figure 4.21:** Authentication Failure Triggering Negative Validation Alert (`APP-021`) | Verified Genuine (43 KB). Red alert banner displaying "Invalid username or password" on bad credentials. |
| `APP-022` | `APP-022_Registration_Form_Initial.png` | 1440x900 | `/register` | Public | Ch. 3.8.2, 4.7.4 | **Figure 4.22:** User Registration and Onboarding Interface (`APP-022`) | Verified Genuine (42 KB). Registration form with username, password, and confirmation password inputs. |
| `APP-023` | `APP-023_404_RFC7807_Not_Found.png` | 1440x900 | `/nonexistent-404` | Public | Ch. 3.7, 5.34 | **Figure 4.23:** RFC 7807 Problem Details 404 Not Found Fallback View (`APP-023`) | Verified Genuine (111 KB). Formatted error page with error code, message, and return navigation button. |
| `APP-024` | `APP-024_Responsive_Tablet_768.png` | 768x1024 | `/` (Tablet) | Public | Ch. 4.7.14, 5.11 | **Figure 4.24:** Responsive Layout Verification on Tablet Viewport (768x1024) (`APP-024`) | Verified Genuine (40 KB). Tablet portrait view with collapsed sidebar and optimized touch spacing. |
| `APP-025` | `APP-025_Responsive_Mobile_375.png` | 375x812 | `/` (Mobile) | Public | Ch. 4.7.14, 5.11 | **Figure 4.25:** Responsive Layout Verification on Mobile Viewport (375x812) (`APP-025`) | Verified Genuine (39 KB). Mobile view with bottom tab navigation bar and single-column feed stack. |
| `APP-026` | `APP-026_Workflow_Login_Success.png` | 1440x900 | `/` (Post-Login) | Authenticated | Ch. 4.7.4, 5.29 | **Figure 4.26:** Authenticated Feed Rendering Logged-In User Avatar and Controls (`APP-026`) | Re-captured Genuine (119 KB). Verified home feed rendering authenticated user pill, avatar, and logout icon. |

---

## 3. Test Execution Console Terminal Captures (7 Assets)
**Storage Directory:** `QA_VERIFICATION/03_TEST_EXECUTION_EVIDENCE/`

| Evidence ID | Filename | Resolution | Executed Test Suite | Tests Run | Report Placement | Suggested Figure Number & Caption | Visual Verification & Academic Suitability |
|:---:|:---|:---:|:---|:---:|:---:|:---|:---|
| `TERM-001` | `TERM-001_Frontend_Vitest_292_Tests.png` | 1002x896 | Frontend Unit & Component Testing | 292 Tests (24 files) | Ch. 5.2, 5.25, 6.1 | **Figure 5.1:** Vitest Runner Console Output for 292 Frontend Unit Tests (`TERM-001`) | Verified Genuine (78 KB). Displays 24 passing test suites, 292 passing assertions, and 3.75s execution duration. |
| `TERM-002` | `TERM-002_Backend_Serialization_6_Tests.png`| 1002x488 | Backend Fastify Serialization Testing | 6 Tests (1 file) | Ch. 5.25, 6.1 | **Figure 5.2:** Vitest Backend Serialization Unit Suite Passing 6/6 Tests (`TERM-002`) | Verified Genuine (26 KB). Validates JSON serialization, cursor encoding, and timestamp formatting. |
| `TERM-003` | `TERM-003_Equivalence_Partitioning_19_Cases.png`| 1002x896 | Equivalence Partitioning Testing | 19 Cases (6 schemas) | Ch. 5.3, 6.1 | **Figure 5.3:** Execution Log for 19 Equivalence Partitioning Test Cases (`TERM-003`) | Verified Genuine (95 KB). Detailed table output of valid/invalid partition evaluations passing 100%. |
| `TERM-004` | `TERM-004_Error_Guessing_10_Defenses.png` | 1002x649 | Error Guessing & Exploit Defense | 10 Vectors | Ch. 5.14, 6.1 | **Figure 5.4:** Execution Output for 10 Error Guessing Vulnerability Attacks (`TERM-004`) | Verified Genuine (60 KB). Confirms rejection of NoSQL injection, prototype pollution, and path traversal. |
| `TERM-005` | `TERM-005_Boundary_Value_Analysis_44_Tests.png`| 1002x387 | Boundary Value Analysis & Negative | 44 Tests (32 BVA + 12 Neg) | Ch. 5.4, 6.1 | **Figure 5.5:** Execution Output for Boundary Value Analysis Suite (`TERM-005`) | Verified Genuine (23 KB). Verifies exact min-1, min, max, max+1 boundary evaluations across all schemas. |
| `TERM-006` | `TERM-006_AST_Cyclomatic_Complexity.png` | 1002x287 | Static AST McCabe Complexity Audit | 184 Functions | Ch. 5.24, 6.2 | **Figure 5.6:** Python AST Cyclomatic Complexity Audit across 184 Functions (`TERM-006`) | Verified Genuine (13 KB). Audits 184 functions: 183 adhere to $CC \le 10$, flags `buildFeedPipeline` ($CC=11$). |
| `TERM-007` | `TERM-007_Browser_E2E_Playwright_Execution.png`| 1002x750 | Headless Playwright Browser E2E | 5 Scenarios | Ch. 5.29, 6.1 | **Figure 5.7:** Playwright E2E Multi-Step Browser Runner Executing 5 Scenarios (`TERM-007`) | Verified Genuine (51 KB). Console output detailing pass status for authentication, feed, search, and theme flows. |

---

## 4. Automated Playwright E2E Scenario Captures (5 Assets)
**Storage Directory:** `QA_VERIFICATION/03_TEST_EXECUTION_EVIDENCE/`

| Evidence ID | Filename | Resolution | Automated Scenario Step | Report Placement | Suggested Figure Number & Caption | Visual Verification & Academic Suitability |
|:---:|:---|:---:|:---|:---:|:---|:---|
| `E2E-001` | `E2E-001_Negative_Auth_Alert.png` | 1440x900 | Scenario 1: Negative Authentication Alert | Ch. 5.20, 5.29 | **Figure 5.8:** Automated Playwright Capture of Negative Authentication Error Alert (`E2E-001`) | Verified Genuine (43 KB). Browser step showing live rejection message when submitting invalid credentials. |
| `E2E-002` | `E2E-002_Registration_Success.png` | 1440x900 | Scenario 2: User Registration & Redirect | Ch. 5.29 | **Figure 5.9:** Automated Playwright Capture of Successful User Onboarding (`E2E-002`) | Verified Genuine (119 KB). Post-registration feed view demonstrating automatic session initialization. |
| `E2E-003` | `E2E-003_Home_Feed_Delivery.png` | 1440x900 | Scenario 3: Feed Tab Switching & Delivery | Ch. 5.28, 5.29 | **Figure 5.10:** Automated Playwright Capture of Feed Tab Switching (`E2E-003`) | Verified Genuine (212 KB). Feed rendering Top ranked items after automated click on Top tab. |
| `E2E-004` | `E2E-004_Universal_Search.png` | 1440x900 | Scenario 4: Debounced Search Query | Ch. 5.29 | **Figure 5.11:** Automated Playwright Capture of Debounced Universal Search Query (`E2E-004`) | Verified Genuine (138 KB). Search input typed with query string and result cards dynamically populated. |
| `E2E-005` | `E2E-005_Theme_Customization.png` | 1440x900 | Scenario 5: Theme Switcher Mutation | Ch. 5.29 | **Figure 5.12:** Automated Playwright Capture of Dark/Light Theme Switching (`E2E-005`) | Verified Genuine (140 KB). Visual theme toggled via automated button click, updating DOM stylesheet classes. |

---

## 5. Host Environment Telemetry Evidence (1 Asset)
**Storage Directory:** `QA_VERIFICATION/04_ENVIRONMENT_EVIDENCE/`

| Evidence ID | Filename | Resolution | Captured View | Report Placement | Suggested Figure Number & Caption | Visual Verification & Academic Suitability |
|:---:|:---|:---:|:---|:---:|:---|:---|
| `ENV-001` | `ENV-001_System_Hardware_And_Software.png` | 1002x548 | `fastfetch` Terminal Specification Card | Ch. 2.6, 4.1 | **Figure 2.1:** Host Machine Telemetry and Hardware Specifications via Fastfetch (`ENV-001`) | Verified Genuine (74 KB). Visual specification card detailing Dell 00JGRJ, Intel Core i3-1005G1, 8GB RAM, and Win 11 Pro. |
