# SocialGraph — Quality Assurance and Testing Evidence Repository

This directory contains the formal testing baseline, test cases, screenshots, automated execution outputs, coverage metrics, and defect register for the **SocialGraphandFeed** platform.

## Directory Structure

```
testing/
├── README.md
├── environment/
│   ├── deployment-baseline.md          # Deployed commit, Render platform info, and hash verification
│   └── environment-details.md          # Hardware, OS, runtime, and framework specifications
├── test-cases/
│   ├── black-box/                      # 22 black-box test specifications
│   ├── white-box/                      # 8 white-box test specifications
│   ├── boundary-value-analysis/        # BVA specifications and numeric/string boundaries
│   └── negative-testing/               # Negative input and malformed payload tests
├── screenshots/
│   ├── black-box/                      # Visual execution evidence for black-box testing
│   ├── white-box/                      # Code analysis, coverage, and complexity evidence
│   ├── boundary-value-analysis/        # Visual evidence of boundary passes and failures
│   └── negative-testing/               # Error handling and rejection screenshots
├── test-results/
│   ├── automated-test-results/         # Vitest outputs, CLI test logs
│   ├── coverage-reports/               # Statement, branch, and function coverage reports
│   ├── performance-results/            # Latency, throughput, and stress benchmarks
│   └── defect-register/                # Formal defect tracking log (passes and identified bugs)
└── limitations/
    └── unperformed-tests.md            # Technical and architectural rationale for partial/unperformed tests
```

## Current Status

- **Phase 1 (Deployment Baseline):** COMPLETE & VERIFIED.
  - Deployed commit `94540883ab99b8862ac995fa9afebc2e9eadaa16` retrieved into clean testing workspace.
  - Original development workspace preserved untouched.
  - Deployed application on Render (`https://socialgraph-feed.onrender.com`) verified healthy (HTTP 200).
  - Frontend and backend builds verified with zero compilation errors.
- **Phase 2 (Module Inventory):** PENDING APPROVAL.
- **Phase 3-5 (Test Execution & Evidence Collection):** PENDING APPROVAL.
