import fs from 'fs';
import path from 'path';

function getPngDimensions(buf) {
  if (buf.length < 24 || buf.toString('ascii', 1, 4) !== 'PNG') return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf.readUInt8(24);
  const colorType = buf.readUInt8(25);
  return { width, height, bitDepth, colorType };
}

const dirs = [
  'QA_VERIFICATION/02_APPLICATION_SCREENSHOTS',
  'QA_VERIFICATION/03_TEST_EXECUTION_EVIDENCE',
  'QA_VERIFICATION/04_ENVIRONMENT_EVIDENCE'
];

const results = [];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    continue;
  }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    const buf = fs.readFileSync(full);
    const meta = getPngDimensions(buf);
    results.push({
      dir,
      file: f,
      sizeBytes: stat.size,
      dimensions: meta ? `${meta.width}x${meta.height}` : 'INVALID',
      bitDepth: meta?.bitDepth,
      colorType: meta?.colorType,
      isValid: !!meta && stat.size > 1000
    });
  }
}

console.log(JSON.stringify(results, null, 2));
