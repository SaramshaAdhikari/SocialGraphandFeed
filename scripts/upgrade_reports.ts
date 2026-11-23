import * as fs from 'node:fs';
import * as path from 'node:path';

interface ReportData {
  filePath: string;
  reportTitle: string;
  techniqueId: string;
  objective: string;
  scope: string;
  testEnvironment: string;
  setupPreconditions: string;
  testCasesTable: string;
  scriptRelPath: string;
  codeSnippet: string;
  executionCommand: string;
  expectedResults: string;
  actualResults: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  blockedCases: number;
  status: 'PASS' | 'PARTIAL' | 'NOT PERFORMED';
  defectSummary: string;
  riskAnalysis: string;
  screenshots: Array<{ filename: string; description: string }>;
  rawLogFilename: string;
  limitations: string;
}

const rootDir = 'C:\\Users\\saram\\Projects\\SocialGraphandFeed_Testing';

export function generateReportMarkdown(data: ReportData): string {
  const screenshotsSection = data.screenshots.map((s, idx) => 
    `${idx + 1}. **${s.description}:**\n   - File: \`${s.filename}\`\n   - Path: [${path.basename(s.filename)}](file:///${path.resolve(rootDir, s.filename).replace(/\\/g, '/')})`
  ).join('\n\n');

  const rawLogRelPath = `testing/execution_logs/${data.rawLogFilename}`;
  const rawLogFullPath = path.resolve(rootDir, rawLogRelPath).replace(/\\/g, '/');
  const scriptFullPath = path.resolve(rootDir, data.scriptRelPath).replace(/\\/g, '/');

  return `# ${data.reportTitle}

---

### 1. Objective
${data.objective}

---

### 2. Scope
${data.scope}

---

### 3. Test Environment
${data.testEnvironment}

---

### 4. Test Setup and Preconditions
${data.setupPreconditions}

---

### 5. Test Cases
${data.testCasesTable}

---

### 6. Actual Test Code or Manual Procedure
**Test Script Location:** [\`${data.scriptRelPath}\`](file:///${scriptFullPath})

\`\`\`typescript
${data.codeSnippet.trim()}
\`\`\`

---

### 7. Execution Command
\`\`\`bash
${data.executionCommand}
\`\`\`

---

### 8. Expected Results
${data.expectedResults}

---

### 9. Actual Results
${data.actualResults}

---

### 10. Execution Summary
- **Total Test Cases / Assertions:** ${data.totalCases}
- **Passed:** ${data.passedCases}
- **Failed:** ${data.failedCases}
- **Blocked / Infeasible:** ${data.blockedCases}
- **Final Classification Status:** **${data.status}**

---

### 11. Defect Summary
${data.defectSummary}

---

### 12. Risk Analysis
${data.riskAnalysis}

---

### 13. Screenshot and Evidence References
${screenshotsSection}

- **Raw Execution Log:** [\`${rawLogRelPath}\`](file:///${rawLogFullPath})

---

### 14. Limitations
${data.limitations}
`;
}
