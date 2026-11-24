import fs from 'fs';

const logs = [
  'performance_execution.log',
  'recovery_execution.log',
  'security_execution.log',
  'acceptance_testing_execution.log',
  'condition_coverage_execution.log',
  'path_coverage_execution.log',
  'scalability_execution.log',
  'stress_execution.log',
  'system_testing_execution.log',
  'desk_checking_execution.log'
];

for (const name of logs) {
  const p = 'testing/execution_logs/' + name;
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf8');
    console.log(`\n========================================`);
    console.log(`FILE: ${name} (${content.length} chars)`);
    console.log(`========================================`);
    console.log(content.slice(0, 400));
  } else {
    console.log(`FILE: ${name} NOT FOUND`);
  }
}
