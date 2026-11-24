# Phase 3.2 Master Figure Register: Chapters 1–4

**Course:** Software Testing (23CSE502)  
**Institution:** JAIN (Deemed-to-be University), Department of Computer Science and Engineering  
**Application Under Test:** DMND (`SocialGraphandFeed`)  
**Baseline Git Commit:** `eb1f5ba4be1edd35f148d1f18a3dc748458828fb`  
**Purpose:** Formal academic catalog of all figures, architectural diagrams, and visual evidence assets embedded across the Preliminary Pages and Chapters 1 through 4.

---

## 1. Master Figure Ledger (Chapters 1–4)

All visual assets cited in Chapters 1 through 4 exist, have been verified for integrity, and are stored in `QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/`, `QA_VERIFICATION/03_TEST_EXECUTION_EVIDENCE/`, `QA_VERIFICATION/04_ENVIRONMENT_EVIDENCE/`, and `QA_VERIFICATION/07_DIAGRAMS_AND_DOCUMENTATION/`.

```
Left-Aligned Master Figure Table:

Figure ID   Formal Figure Caption                                          Evidence ID  Resolution  Storage File Path                                                          Placement
---------   ------------------------------------------------------------   -----------  ----------  ------------------------------------------------------------------------   ---------
Figure 1.1  The Software Testing Life Cycle (STLC) and V-Model Alignment   DIAG-STLC    Vector      QA_VERIFICATION/07_DIAGRAMS_AND_DOCUMENTATION/ARCHITECTURE_DIAGRAMS.md     Ch. 1.1
Figure 1.2  Multi-Layer Testing Pyramid across Unit, Integration, and E2E  DIAG-PYRAMID Vector      QA_VERIFICATION/07_DIAGRAMS_AND_DOCUMENTATION/ARCHITECTURE_DIAGRAMS.md     Ch. 1.1
Figure 2.1  System Runtime and Network Topology Architecture Diagram       DIAG-TOPO    Vector      QA_VERIFICATION/07_DIAGRAMS_AND_DOCUMENTATION/ARCHITECTURE_DIAGRAMS.md     Ch. 2.2
Figure 2.2  Hybrid Feed Generation Pipeline (Meta TAO Fan-Out Architecture)DIAG-FEED    Vector      QA_VERIFICATION/07_DIAGRAMS_AND_DOCUMENTATION/ARCHITECTURE_DIAGRAMS.md     Ch. 2.5
Figure 2.3  Responsive Masonry Grid Layout on Discover Page (APP-004)      APP-004      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-004_Discover_Masonry_Grid   Ch. 2.3.14
Figure 2.4  Interactive Force-Directed Social Graph Visualization (APP-005)APP-005      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-005_Interactive_Social_...  Ch. 2.3.14
Figure 4.1  Host Machine Telemetry via Fastfetch (ENV-001)                 ENV-001      1002x548    QA_VERIFICATION/04_ENVIRONMENT_EVIDENCE/ENV-001_System_Hardware_And_...   Ch. 4.2
Figure 4.2  Defect Classification, Severity Triage, and Remediation        DIAG-DEFECT  Vector      QA_VERIFICATION/07_DIAGRAMS_AND_DOCUMENTATION/ARCHITECTURE_DIAGRAMS.md     Ch. 4.7
Figure 4.3  Desktop Home Feed Interface with Top Seeded Post (APP-001)     APP-001      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-001_Landing_Home_Feed_...  Ch. 4.8.1
Figure 4.4  Algorithmic Home Feed Ranked by Engagement Decay Score (APP-002)APP-002     1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-002_Home_Feed_Top_Tab.png  Ch. 4.8.2
Figure 4.5  Chronological Home Feed Sorted by Creation Timestamp (APP-003) APP-003      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-003_Home_Feed_New_Tab.png  Ch. 4.8.2
Figure 4.6  Discover Page Responsive Multi-Column Masonry Grid (APP-004)   APP-004      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-004_Discover_Masonry_Grid   Ch. 4.8.3
Figure 4.7  Initial User Authentication Screen with Form Fields (APP-020)  APP-020      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-020_Login_Form_Initial.png  Ch. 4.8.4
Figure 4.8  Negative Credential Rejection Error Banner (APP-021)           APP-021      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-021_Login_Validation_...   Ch. 4.8.4
Figure 4.9  Post-Login Authenticated Feed Rendering User Avatar (APP-026)  APP-026      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-026_Workflow_Login_...     Ch. 4.8.4
Figure 4.10 Interactive Force-Directed Social Graph Clusters (APP-005)     APP-005      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-005_Interactive_Social_...  Ch. 4.8.5
Figure 4.11 Individual Post Detail Discussion View (APP-006)               APP-006      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-006_Post_Detail_Discus...  Ch. 4.8.6
Figure 4.12 Hierarchical Nested Threaded Comments and Reply Box (APP-007)  APP-007      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-007_Threaded_Comments_...  Ch. 4.8.6
Figure 4.13 Settings Appearance Interface with Theme Selectors (APP-017)   APP-017      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-017_Settings_Appearan...    Ch. 4.8.7
Figure 4.14 Profile Settings Editor with Form Inputs (APP-018)            APP-018      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-018_Settings_Profile_...   Ch. 4.8.7
Figure 4.15 Public Communities Directory with Member Counts (APP-009)      APP-009      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-009_Communities_Direc...    Ch. 4.8.8
Figure 4.16 Distributed Systems Community Hub Scoped Feed (APP-010)       APP-010      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-010_Community_Detail_...   Ch. 4.8.8
Figure 4.17 Universal Search Results for Query 'systems' (APP-011)         APP-011      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-011_Universal_Search_...   Ch. 4.8.9
Figure 4.18 Empty Post Creation Modal with TypeBox Input Fields (APP-012)  APP-012      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-012_Create_Post_Compo...    Ch. 4.8.10
Figure 4.19 Populated Post Composer with Tag Counters (APP-013)            APP-013      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-013_Create_Post_Compo...    Ch. 4.8.10
Figure 4.20 User Saved Bookmarks and Collections Grid (APP-014)            APP-014      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-014_Saved_Collections...   Ch. 4.8.11
Figure 4.21 Direct Messaging Split-Pane View with Active Chat (APP-015)    APP-015      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-015_Direct_Messages_...    Ch. 4.8.12
Figure 4.22 Operational Diagnostics Telemetry Dashboard (APP-019)          APP-019      1440x900    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-019_System_Diagnostic...   Ch. 4.8.13
Figure 4.23 Tablet Portrait Responsive Viewport 768x1024 (APP-024)         APP-024      768x1024    QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-024_Responsive_Tablet...   Ch. 4.8.14
Figure 4.24 Mobile Portrait Responsive Viewport 375x812 (APP-025)          APP-025      375x812     QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-025_Responsive_Mobile...   Ch. 4.8.14
```

---

## 2. Supplementary Visual Targets (Not Yet Created — Tracked as Gaps)

In strict accordance with Phase 3.2 instructions, the four supplementary evidence targets identified during Phase 3.1.1 are formally tracked as planned supplementary assets and are **NOT** represented as existing figures in Chapters 1–4:

1. `TERM-008_HTTP_Security_Headers_Audit.png`: Console capture of `curl.exe -I http://127.0.0.1:3000` proving Defect `SEC-005`. (Allocated to Chapter 5.30 / 5.42 / Chapter 7).
2. `TERM-009_V8_Multi_Metric_Coverage_Table.png`: Full tabular console output of `npx vitest run --coverage`. (Allocated to Chapter 5.19 / 5.23 / Chapter 6).
3. `TERM-010_Diagnostics_JSON_Payload.png`: Raw JSON response from `http://127.0.0.1:4000/api/v1/diagnostics`. (Allocated to Chapter 5.34 / 5.35).
4. `DIAG-CFG-001_AuthService_Login_CFG.png`: Vector Control Flow Graph of `AuthService.login()`. (Allocated to Chapter 5.20 / 5.21).
