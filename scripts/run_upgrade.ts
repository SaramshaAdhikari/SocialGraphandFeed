import * as fs from 'node:fs';
import * as path from 'node:path';
import { generateReportMarkdown } from './upgrade_reports.js';
import { blackBoxReportsPart1 } from './data_blackbox_1.js';
import { blackBoxReportsPart2 } from './data_blackbox_2.js';
import { whiteBoxAndSpecialReports } from './data_whitebox_and_special.js';

const rootDir = 'C:\\Users\\saram\\Projects\\SocialGraphandFeed_Testing';

const allReports = [
  ...blackBoxReportsPart1,
  ...blackBoxReportsPart2,
  ...whiteBoxAndSpecialReports,
];

console.log(`Upgrading ${allReports.length} markdown test reports to 14 mandatory sections...`);

let upgradedCount = 0;

for (const report of allReports) {
  const fullPath = path.resolve(rootDir, report.filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const markdownContent = generateReportMarkdown(report);
  fs.writeFileSync(fullPath, markdownContent, 'utf-8');
  upgradedCount++;
  console.log(`✓ Upgraded [${report.techniqueId}] -> ${report.filePath}`);
}

console.log(`\nSuccessfully upgraded all ${upgradedCount} test reports to full 14-section compliance!`);
