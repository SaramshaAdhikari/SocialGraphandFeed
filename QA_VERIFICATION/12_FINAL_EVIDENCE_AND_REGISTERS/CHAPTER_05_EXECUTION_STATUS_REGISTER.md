# Chapter 5 Master Execution Status Register

**Course:** Software Testing (23CSE502)  
**Institution:** JAIN (Deemed-to-be University), Department of Computer Science and Engineering  
**Application Under Test:** DMND (`SocialGraphandFeed`)  
**Baseline Git Commit:** `eb1f5ba4be1edd35f148d1f18a3dc748458828fb`  
**Working Directory:** `QA_VERIFICATION/10_CHAPTER_5_PRODUCTION/`  
**Purpose:** Formal academic registry establishing the execution classification, verified test counts, log references, visual figures, and code linkages across all 45 prescribed syllabus testing techniques.

---

## 1. Master Technique Classification Ledger (Techniques 1 through 45)

```
Left-Aligned Master Technique Classification Register:

#    Syllabus Technique Name           Category         Official Classification               Executed Count / Scope  Primary Log File                    Figure Reference    Code Excerpt Linkage
---  --------------------------------  ---------------  ------------------------------------  ----------------------  ----------------------------------  ------------------  --------------------
1    Non-Functional Testing            Non-Functional   Partially Executed                    4 operational metrics   performance_execution.log           Figure 5.20         Code Excerpt 5.18
2    Regression Testing                Verification     Independently Executed & Verified     292 unit assertions     frontend_vitest_execution.log       Figure 5.1          Code Excerpt 5.1
3    Equivalence Partitioning          Black-Box        Independently Executed & Verified     19 partition cases      equivalence_partitioning_execution  Figure 5.2          Code Excerpt 5.2
4    Boundary Value Analysis           Black-Box        Independently Executed & Verified     32 boundary assertions  bva_and_negative_execution.log      Figure 5.3          Code Excerpt 5.3
5    Decision Table Testing            Functional       Previously Executed & Indep. Verified 4 truth table rules     backend_integration_suites.log      Figure 5.4          Code Excerpt 5.4
6    State Transition Testing          Black-Box        Previously Executed & Indep. Verified 5 lifecycle states      backend_integration_suites.log      Figure 5.5          Code Excerpt 5.5
7    Exploratory Testing               Black-Box        Independently Executed & Verified     1 unscripted charter    verified_e2e_execution.log          Figure 5.6          Code Excerpt 5.6
8    Random Testing (Monkey)           Black-Box        Independently Executed & Verified     50 fuzzing dispatches   error_guessing_execution.log        Figure 5.7          Code Excerpt 5.7
9    Requirements-Based Testing        Verification     Previously Executed & Indep. Verified 15 functional criteria  acceptance_testing_execution.log    Figure 5.8          Code Excerpt 5.21
10   Cause-Effect Graphing             Black-Box        Previously Executed & Indep. Verified 6 causal inputs         backend_integration_suites.log      Figure 5.9          Code Excerpt 5.8
11   Compatibility Testing             Non-Functional   Independently Executed & Verified     3 responsive viewports  verified_e2e_execution.log          Figure 5.10         Code Excerpt 5.9
12   User Documentation Testing        Non-Functional   Independently Executed & Verified     1 clean setup audit     configuration_execution.log         Figure 5.11         Table 4.1
13   Domain Testing                    Functional       Independently Executed & Verified     8 domain boundaries     bva_and_negative_execution.log      Figure 5.3          Code Excerpt 5.10
14   Error Guessing Testing            Black-Box        Independently Executed & Verified     10 attack vectors       error_guessing_execution.log        Figure 5.7          Code Excerpt 5.11
15   White-Box Testing                 White-Box        Previously Executed & Indep. Verified 2 structural loops      desk_checking_execution.log         Figure 5.12         Code Excerpt 5.12
16   Desk Checking                     White-Box        Analytically Evaluated                1 Lua atomic script     desk_checking_execution.log         Figure 5.13         Code Excerpt 5.13
17   Unit / Code Functional Testing    White-Box        Independently Executed & Verified     8 assertion checks      unit_code_functional_execution.log  Figure 5.1          Code Excerpt 5.14
18   Functional Testing                Functional       Independently Executed & Verified     85 component tests      frontend_vitest_execution.log       Figure 5.14         Code Excerpt 5.15
19   Statement Coverage                White-Box        Independently Executed & Verified     34.00% statement cov    code_coverage_execution.log         Figure 5.1          Code Excerpt 5.16
20   Path Coverage                     White-Box        Analytically Evaluated                4 basis paths           path_coverage_execution.log         Figure 5.15         Code Excerpt 5.17
21   Condition Coverage                White-Box        Analytically Evaluated                2 compound predicates   condition_coverage_execution.log    Figure 5.4          Code Excerpt 5.18
22   Function Coverage                 White-Box        Independently Executed & Verified     31.12% function cov     function_coverage_execution.log     Figure 5.1          Code Excerpt 5.16
23   Code Coverage Testing             White-Box        Independently Executed & Verified     4 coverage dimensions   v8_coverage_execution.log           Figure 5.1          Code Excerpt 5.16
24   Code Complexity Testing           White-Box        Independently Executed & Verified     184 functions audited   cyclomatic_complexity_execution.log Figure 5.13         Table 6.2
25   Unit Testing                      White-Box        Independently Executed & Verified     298 unit assertions     frontend_vitest_execution.log       Figure 5.1 & 5.12   Code Excerpt 5.1 & 5.19
26   Integration Testing               Grey-Box         Previously Executed & Indep. Verified 36 backend suites       backend_integration_suites.log      Figure 5.12         Code Excerpt 5.12
27   System Testing                    Black-Box        Independently Executed & Verified     Full integrated system  verified_e2e_execution.log          Figure 5.16         Code Excerpt 5.20
28   Acceptance Testing                Black-Box        Previously Executed & Indep. Verified 5 acceptance journeys   acceptance_testing_execution.log    Figure 5.17         Table 2.2
29   Scenario Testing                  Black-Box        Independently Executed & Verified     5 multi-step workflows  verified_e2e_execution.log          Figure 5.8 & 5.18   Code Excerpt 5.21
30   Defect Bash Elimination           Black-Box        Independently Executed & Verified     1 ad-hoc hunt session   defect_bash_execution.log           SEC-005 Log         Code Excerpt 5.18
31   Scalability Testing               Non-Functional   Implemented but Not Reproduced        1 benchmark suite       scalability_execution.log           Figure 5.20         Code Excerpt 5.13
32   Reliability Testing               Non-Functional   Previously Executed & Indep. Verified 1 soak error monitor    reliability_execution.log           Figure 5.20         Code Excerpt 5.29
33   Stress Testing                    Non-Functional   Implemented but Not Reproduced        1 high-load suite       stress_execution.log                Figure 5.11         ENV-SPEC.md
34   Interoperability Testing          Functional       Independently Executed & Verified     6 schema mappings       interoperability_execution.log      Figure 5.19         Code Excerpt 5.22
35   Performance Testing               Non-Functional   Partially Executed                    3 benchmark metrics     performance_execution.log           Figure 5.20         Table 6.3
36   Internationalization (I18N)       Globalization    Independently Executed & Verified     12 UTF-8 string vectors i18n_execution.log                  Figure 5.5          Code Excerpt 5.23
37   Enabling Testing                  Accessibility    Independently Executed & Verified     1 accessibility audit   enabling_execution.log              Figure 5.21         Code Excerpt 5.24
38   Localization (L10N) Testing       Globalization    Previously Executed & Indep. Verified 1 UI string audit       localization_execution.log          Figure 5.14         Code Excerpt 5.14
39   Fake Language Testing             Globalization    Independently Executed & Verified     5 expanded containers   fake_language_execution.log         Figure 5.16         Code Excerpt 5.25
40   Language Compatibility Testing    Globalization    Independently Executed & Verified     4 collation regex tests language_compatibility_execution.logFigure 5.22         Code Excerpt 5.26
41   Configuration Testing             Environment      Independently Executed & Verified     3 runtime profiles      configuration_execution.log         Figure 5.11         Code Excerpt 5.27
42   Security Testing                  Non-Functional   Independently Executed & Verified     5 security controls     security_execution.log              Figure 5.4          Code Excerpt 5.28
43   Recovery Testing                  Non-Functional   Partially Executed                    2 reconnect handlers    recovery_execution.log              Figure 5.20         Code Excerpt 5.29
44   Alpha Testing                     Operational      Independently Executed & Verified     376 executed tests      alpha_execution.log                 Figure 5.23         Table 4.3
45   Beta Testing                      Operational      Not Performed                         0 external cohort tests beta_execution.log                  N/A                 Academic Boundary
```

---

## 2. Statistical Breakdown of Classification Categories

```
+----------------------------------------------------------------------------------------------------+
| Category Breakdown across the 45 Assigned Techniques:                                              |
|                                                                                                    |
| 1. Independently Executed & Verified:        27 Techniques (60.0%)                                 |
| 2. Previously Executed & Indep. Verified:     9 Techniques (20.0%)                                 |
| 3. Implemented but Not Reproduced:            2 Techniques ( 4.4% - Scalability and Stress testing) |
| 4. Partially Executed:                        3 Techniques ( 6.7% - Non-Func, Perf, Recovery)      |
| 5. Analytically Evaluated:                    3 Techniques ( 6.7% - Desk Checking, Path, Condition)|
| 6. Not Performed:                             1 Technique  ( 2.2% - Beta Testing)                  |
| 7. Not Applicable:                            0 Techniques ( 0.0%)                                 |
| -------------------------------------------------------------------------------------------------- |
| Total Techniques Prescribed by Syllabus:     45 Techniques (100.0%)                                |
+----------------------------------------------------------------------------------------------------+
```
