# Preliminary Pages Draft: Academic Software Testing and Quality Assurance Report

**Course:** Software Testing (23CSE502)  
**Institution:** JAIN (Deemed-to-be University), Faculty of Engineering and Technology, Department of Computer Science and Engineering  
**Application Under Test:** DMND (`SocialGraphandFeed`) — Social Graph and Scalable Feed System  
**Baseline Git Commit:** `eb1f5ba4be1edd35f148d1f18a3dc748458828fb`  

---

## Cover Page (Institutional Reference: JAIN University Faculty of Engineering and Technology)

```
================================================================================
                                JAIN (Deemed-to-be University)
                            Faculty of Engineering and Technology
                        Department of Computer Science and Engineering
     Global Campus, Jakkasandra Post, Kanakapura Taluk, Ramanagara District, Pin Code: 562 112
                                      2026-2027

                                   A Project Report on
       "Software Testing and Quality Assurance of the DMND Social Graph and Scalable Feed System"

                           BACHELOR OF TECHNOLOGY IN COMPUTER SCIENCE AND ENGINEERING

                                      Submitted by:
                                  [CANDIDATE_NAME_1]
                                  [CANDIDATE_USN_1]

                                  [CANDIDATE_NAME_2]
                                  [CANDIDATE_USN_2]

                                  [CANDIDATE_NAME_3]
                                  [CANDIDATE_USN_3]

                                Course: Software Testing (23CSE502)
                                 Faculty Supervisor: [FACULTY_NAME]
================================================================================
```

---

## Abstract

This project report presents a comprehensive empirical evaluation of software testing and quality assurance applied to the DMND (`SocialGraphandFeed`) platform. DMND is a high-concurrency, distributed social networking engine developed in TypeScript, featuring an interactive force-directed social graph, a hybrid dual-strategy feed delivery pipeline (Meta TAO fan-out architecture), threaded community discussions, and real-time operational telemetry. The application executes across a decoupled three-tier runtime architecture consisting of a Single Page Application (React 18, Vite, TanStack Query, Zustand, TailwindCSS) on port 3000, a high-performance REST microservice (Node.js, Fastify v4) on port 4000, a persistent document datastore (MongoDB v7.0.14 single-node replica set `rs0` on port 27017) supporting multi-document ACID transactions, and an in-memory cache (Redis v8.10.1 on port 6379) executing atomic Lua scripts for sliding-window rate limiting.

The primary objective of this study is the rigorous verification and validation of the application across the 45 software testing techniques assigned under the JAIN University 23CSE502 curriculum. Across the evaluation lifecycle, all 45 techniques were formally analyzed, resulting in 27 independently executed and verified techniques, 9 previously executed and independently verified techniques, 2 implemented but un-reproduced techniques (Scalability and Stress testing constrained by host workstation infrastructure), 3 partially executed techniques (Non-Functional, Performance, and Recovery testing), 3 analytically evaluated techniques (Desk Checking, Basis Path Coverage, and Boolean Condition Coverage), 1 justified unperformed technique (Beta testing deferred due to academic cohort boundaries), and 0 non-applicable techniques.

A total of **376 unique test cases** were independently executed across seven dedicated local test runners, achieving an overall **pass rate of 100% (376/376 passed, 0 failed, 0 regressions)**. The executed test suites comprise 292 frontend unit and component assertions (Vitest / JSDOM), 6 backend serialization assertions (Vitest), 32 boundary-value analysis assertions (`@sinclair/typebox`), 12 negative rejection assertions, 19 equivalence-partitioning class evaluations, 10 error-guessing exploit defense vectors (blocking NoSQL operator injection, prototype pollution, and path traversal), and 5 automated end-to-end user workflows (Playwright Core). Separately, a 36-suite Fastify backend integration suite was audited, reporting 33 passed suites and 3 suite failures (`BE-INT-001` through `BE-INT-003`), which were forensically reconciled as test fixture expectation mismatches resulting from database seed expansion (115 users versus 20) and security pre-handler interception (`HTTP 401 Unauthorized` versus `HTTP 400 Bad Request`).

White-box structural evaluation included an Abstract Syntax Tree (AST) McCabe Cyclomatic Complexity audit across 184 backend functions using Python 3.12: 183 functions (99.5%) demonstrated high maintainability ($CC \le 10$), while exactly one function (`buildFeedPipeline` in `FeedService.ts`, $CC=11$) was flagged for modular refactoring due to compound fan-out and sorting branching. V8 dynamic code coverage yielded 34.00% statement coverage, 28.45% branch coverage, and 31.12% function coverage across frontend modules. Defect hunting identified one genuine medium-severity production defect (`SEC-005`), where the static reverse proxy in `production-server.mjs:52-64` omitted Helmet security headers on root `index.html` responses, exposing the SPA to clickjacking; a verified production patch is presented. Furthermore, an architectural localization limitation (`LOC-005`) was identified regarding hardcoded English suffixes in relative timestamp formatting. All empirical testing results are corroborated by 39 verified visual assets and raw console execution logs.

---

## Table of Contents

```
Preliminary Pages
Cover Page .................................................................... [Page i]
Abstract ...................................................................... [Page ii]
Table of Contents ............................................................. [Page iii]
List of Figures ............................................................... [Page v]
List of Tables ................................................................ [Page vii]
List of Abbreviations ......................................................... [Page viii]

Chapter 1 — Introduction
1.1 Foundations of Software Testing ........................................... [Page 1]
1.2 Background of the DMND System ............................................. [Page 2]
1.3 Motivation for Systematic Quality Assurance ............................... [Page 4]
1.4 Problem Statement and Testing Imperatives ................................. [Page 5]
1.5 Organization of the Report ................................................ [Page 6]

Chapter 2 — Project Overview
2.1 Project Description and Operational Context ............................... [Page 7]
2.2 System Runtime and Network Topology ....................................... [Page 8]
2.3 Detailed Architecture of the 15 Application Modules ....................... [Page 10]
2.4 Technology Stack Specifications ........................................... [Page 15]
2.5 Hybrid Feed Delivery Engine (Meta TAO Pattern) ............................ [Page 16]
2.6 Multi-Document Database Transactions ...................................... [Page 18]
2.7 Functional Requirements Baseline .......................................... [Page 19]

Chapter 3 — Testing Objectives and Scope
3.1 Primary Testing Objectives ................................................ [Page 21]
3.2 System Boundaries and Scope Specification ................................. [Page 22]
    3.2.1 In-Scope Components and Subsystems .................................. [Page 22]
    3.2.2 Out-of-Scope Elements and Workstation Constraints ................... [Page 23]
3.3 Functional Testing Targets vs. Non-Functional Criteria .................... [Page 24]
3.4 The 45 Prescribed Testing Techniques and Applicability Matrix ............. [Page 25]
3.5 Testing Assumptions and Risk Boundaries ................................... [Page 26]

Chapter 4 — Testing Methodology
4.1 Overall Testing Strategy and Life Cycle ................................... [Page 27]
4.2 Hardware and Software Environment Specifications .......................... [Page 28]
4.3 Testing Frameworks and Tooling Configuration .............................. [Page 30]
4.4 Test Data Strategy and Database Seeding ................................... [Page 31]
4.5 Execution Process and Multi-Suite Test Runner Architecture ................ [Page 33]
4.6 Evidence Collection and Traceability Methodology .......................... [Page 34]
4.7 Defect Classification, Severity Metrics, and Triage Lifecycle ............. [Page 35]
4.8 Step-by-Step Verified Application Workflow Demonstrations ................. [Page 37]
    4.8.1 Workflow 1: Public Feed Landing and Initial State ................... [Page 37]
    4.8.2 Workflow 2: Top vs. New Algorithmic Feed Sorting .................... [Page 37]
    4.8.3 Workflow 3: Discover Responsive Masonry Grid ........................ [Page 38]
    4.8.4 Workflow 4: User Authentication and Validation Alert ................ [Page 38]
    4.8.5 Workflow 5: Interactive Social Graph Cluster Physics ................ [Page 39]
    4.8.6 Workflow 6: Post Inspection and Threaded Comments ................... [Page 39]
    4.8.7 Workflow 7: Profile Editor and Appearance Theme Toggling ............ [Page 40]
    4.8.8 Workflow 8: Communities Directory and Scoped Hub Feed ............... [Page 40]
    4.8.9 Workflow 9: Universal Full-Text Search Execution .................... [Page 41]
    4.8.10 Workflow 10: Post Creation Modal with Character Validation ......... [Page 41]
    4.8.11 Workflow 11: Saved Bookmarks and Collections Management ............ [Page 41]
    4.8.12 Workflow 12: Direct Messaging Split-Pane Interface ................. [Page 42]
    4.8.13 Workflow 13: Operational System Diagnostics Telemetry .............. [Page 42]
    4.8.14 Workflow 14: Responsive Viewport Fidelity Across Devices ........... [Page 42]
4.9 Summary Preview of Chapter 5 Execution Framework .......................... [Page 42]

Chapter 5 — Testing Techniques and Implementation
5.1 Non-Functional Testing .................................................... [Page --]
5.2 Regression Testing ........................................................ [Page --]
5.3 Equivalence Partitioning .................................................. [Page --]
5.4 Boundary Value Analysis ................................................... [Page --]
5.5 Decision Table Testing .................................................... [Page --]
5.6 State Transition Testing / State-Based Testing ............................ [Page --]
5.7 Exploratory Testing ....................................................... [Page --]
5.8 Random Testing (Monkey Testing) ........................................... [Page --]
5.9 Requirements-Based Testing ................................................ [Page --]
5.10 Cause-Effect Graphing .................................................... [Page --]
5.11 Compatibility Testing .................................................... [Page --]
5.12 User Documentation Testing ............................................... [Page --]
5.13 Domain Testing ........................................................... [Page --]
5.14 Error Guessing Testing ................................................... [Page --]
5.15 White-Box Testing ........................................................ [Page --]
5.16 Desk Checking ............................................................ [Page --]
5.17 Unit / Code Functional Testing ........................................... [Page --]
5.18 Functional Testing ....................................................... [Page --]
5.19 Statement Coverage ....................................................... [Page --]
5.20 Path Coverage ............................................................ [Page --]
5.21 Condition Coverage ....................................................... [Page --]
5.22 Function Coverage ........................................................ [Page --]
5.23 Code Coverage Testing .................................................... [Page --]
5.24 Code Complexity Testing .................................................. [Page --]
5.25 Unit Testing ............................................................. [Page --]
5.26 Integration Testing ...................................................... [Page --]
5.27 System Testing ........................................................... [Page --]
5.28 Acceptance Testing ....................................................... [Page --]
5.29 Scenario Testing ......................................................... [Page --]
5.30 Defect Bash Elimination .................................................. [Page --]
5.31 Scalability Testing ...................................................... [Page --]
5.32 Reliability Testing ...................................................... [Page --]
5.33 Stress Testing ........................................................... [Page --]
5.34 Interoperability Testing ................................................. [Page --]
5.35 Performance Testing ...................................................... [Page --]
5.36 Internationalization (I18N) Testing ...................................... [Page --]
5.37 Enabling Testing ......................................................... [Page --]
5.38 Localization (L10N) Testing .............................................. [Page --]
5.39 Fake Language Testing .................................................... [Page --]
5.40 Language Compatibility Testing ........................................... [Page --]
5.41 Configuration Testing .................................................... [Page --]
5.42 Security Testing ......................................................... [Page --]
5.43 Recovery Testing ......................................................... [Page --]
5.44 Alpha Testing ............................................................ [Page --]
5.45 Beta Testing ............................................................. [Page --]

Chapter 6 — Test Results and Analysis
6.1 Overall Execution Results and Reconciliation .............................. [Page --]
6.2 Coverage and Complexity Results ........................................... [Page --]
6.3 Performance, Scalability, and Reliability Results ......................... [Page --]

Chapter 7 — Defect Identification and Analysis
7.1 Master Defect and Anomaly Ledger .......................................... [Page --]
7.2 Technical Root Cause Analysis of Defect SEC-005 ........................... [Page --]
7.3 Defect Density and Severity Distribution .................................. [Page --]
7.4 Corrective Action Plan and Verified Code Patches .......................... [Page --]

Chapter 8 — Conclusion
8.1 Quality Verdict on the DMND Platform ...................................... [Page --]
8.2 Fulfillment of Testing Objectives ......................................... [Page --]
8.3 Academic and Practical Engineering Learnings .............................. [Page --]

Chapter 9 — Future Enhancements
9.1 Continuous Integration & Automated Regression Pipeline .................... [Page --]
9.2 Distributed Stress Testing via Dedicated Infrastructure ................... [Page --]
9.3 Internationalization (i18n) Framework Adoption ............................ [Page --]
9.4 Automated Visual Regression Testing ....................................... [Page --]

Chapter 10 — References ....................................................... [Page --]
```

---

## List of Figures

```
Left-Aligned Figure Index:

Figure 1.1: The Software Testing Life Cycle (STLC) and V-Model Alignment ........ [Page 2]
Figure 1.2: Multi-Layer Testing Pyramid across Unit, Integration, and E2E Tiers . [Page 4]
Figure 2.1: System Runtime and Network Topology Architecture Diagram ........... [Page 8]
Figure 2.2: Hybrid Feed Generation Pipeline (Meta TAO Fan-Out Architecture) .... [Page 17]
Figure 2.3: Responsive Masonry Grid Layout on Discover Page (APP-004) .......... [Page 14]
Figure 2.4: Interactive Force-Directed Social Graph Visualization (APP-005) .... [Page 15]
Figure 4.1: Host Machine Telemetry via Fastfetch (ENV-001) ...................... [Page 29]
Figure 4.2: Defect Classification, Severity Triage, and Remediation Lifecycle .. [Page 36]
Figure 4.3: Desktop Home Feed Interface with Top Seeded Post (APP-001) ......... [Page 37]
Figure 4.4: Algorithmic Home Feed Ranked by Engagement Decay Score (APP-002) ... [Page 37]
Figure 4.5: Chronological Home Feed Sorted by Creation Timestamp (APP-003) ..... [Page 38]
Figure 4.6: Discover Page Responsive Multi-Column Masonry Grid (APP-004) ....... [Page 38]
Figure 4.7: Initial User Authentication Screen with Form Fields (APP-020) ...... [Page 38]
Figure 4.8: Negative Credential Rejection Error Banner (APP-021) ................ [Page 39]
Figure 4.9: Post-Login Authenticated Feed Rendering User Avatar (APP-026) ...... [Page 39]
Figure 4.10: Interactive Force-Directed Social Graph Clusters (APP-005) ........ [Page 39]
Figure 4.11: Individual Post Detail Discussion View (APP-006) .................. [Page 39]
Figure 4.12: Hierarchical Nested Threaded Comments and Reply Box (APP-007) ..... [Page 40]
Figure 4.13: Settings Appearance Interface with Theme Selectors (APP-017) ...... [Page 40]
Figure 4.14: Profile Settings Editor with Form Inputs (APP-018) ................. [Page 40]
Figure 4.15: Public Communities Directory with Member Counts (APP-009) ......... [Page 40]
Figure 4.16: Distributed Systems Community Hub Scoped Feed (APP-010) .......... [Page 41]
Figure 4.17: Universal Search Results for Query 'systems' (APP-011) ............ [Page 41]
Figure 4.18: Empty Post Creation Modal with TypeBox Input Fields (APP-012) ..... [Page 41]
Figure 4.19: Populated Post Composer with Tag Counters (APP-013) ............... [Page 41]
Figure 4.20: User Saved Bookmarks and Collections Grid (APP-014) ............... [Page 41]
Figure 4.21: Direct Messaging Split-Pane View with Active Chat (APP-015) ....... [Page 42]
Figure 4.22: Operational Diagnostics Telemetry Dashboard (APP-019) ............. [Page 42]
Figure 4.23: Tablet Portrait Responsive Viewport 768x1024 (APP-024) ............ [Page 42]
Figure 4.24: Mobile Portrait Responsive Viewport 375x812 (APP-025) ............. [Page 42]
```

---

## List of Tables

```
Left-Aligned Table Index:

Table 2.1: Core DMND Technology Stack Specifications .......................... [Page 15]
Table 2.2: Functional Requirements Baseline Matrix (FR-01 to FR-12) ............ [Page 19]
Table 3.1: Quality Attribute Verification Matrix: Functional vs. Non-Functional [Page 24]
Table 3.2: Master Classification and Applicability of the 45 Assigned Techniques [Page 25]
Table 4.1: Host Machine Hardware Specifications and Physical Resource Allocation [Page 28]
Table 4.2: Runtime Software Environments, Datastores, and Development Tooling .. [Page 29]
Table 4.3: Independent Test Execution Suite Architecture (376 Reconciled Tests)  [Page 33]
Table 4.4: Master Cross-Reference of 14 Application Workflow Demonstrations ..... [Page 37]
```

---

## List of Abbreviations

```
Left-Aligned Abbreviations Glossary:

API        Application Programming Interface
AST        Abstract Syntax Tree
BVA        Boundary Value Analysis
CC         Cyclomatic Complexity (McCabe Metric)
CFG        Control Flow Graph
CJK        Chinese, Japanese, and Korean Character Sets
CRUD       Create, Read, Update, Delete
CSP        Content Security Policy
CSRF       Cross-Site Request Forgery
DOM        Document Object Model
E2E        End-to-End Browser Testing
EP         Equivalence Partitioning
HTML5      HyperText Markup Language Revision 5
HTTP       Hypertext Transfer Protocol
I18N       Internationalization (18 letters between I and N)
IEEE       Institute of Electrical and Electronics Engineers
ISO        International Organization for Standardization
JSDOM      JavaScript implementation of the DOM for Node.js
JSON       JavaScript Object Notation
JWT        JSON Web Token
L10N       Localization (10 letters between L and N)
MC/DC      Modified Condition / Decision Coverage
NoSQL      Non-Relational / Document Structured Datastore
PRD        Product Requirements Document
QA         Quality Assurance
REST       Representational State Transfer
RFC        Request for Comments
RPS        Requests Per Second
RTL        Right-to-Left Text Script Direction
RWD        Responsive Web Design
SPA        Single Page Application
STLC       Software Testing Life Cycle
TTL        Time To Live (Cache Expiration Duration)
UI         User Interface
USN        University Seat Number
UX         User Experience
V8         Google High-Performance JavaScript and WebAssembly Engine
Vite       Next-Generation Frontend Build Tool and Development Server
```
