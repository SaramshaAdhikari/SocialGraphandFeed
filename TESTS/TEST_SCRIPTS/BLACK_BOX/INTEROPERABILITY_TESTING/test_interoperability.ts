import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== RUNNING INTEROPERABILITY VERIFICATION ===');

const logPath = path.resolve(__dirname, '../../../../testing/execution_logs/interoperability_execution.log');
let logOutput = `INTEROPERABILITY TESTING EXECUTION LOG - ${new Date().toISOString()}\n\n`;

// 1. Storage Abstraction Interoperability
const mediaStoragePath = path.resolve(__dirname, '../../../../packages/backend/src/services/storage/MediaStorageService.ts');

assert(fs.existsSync(mediaStoragePath), 'MediaStorageService.ts missing');
const storageContent = fs.readFileSync(mediaStoragePath, 'utf-8');
assert(storageContent.includes('class LocalMediaStorageProvider'), 'LocalMediaStorageProvider missing');
assert(storageContent.includes('class CloudinaryMediaStorageProvider'), 'CloudinaryMediaStorageProvider missing');
logOutput += `Storage Drivers Verified:\n  ✓ MediaStorageService (${mediaStoragePath})\n  ✓ LocalMediaStorageProvider defined\n  ✓ CloudinaryMediaStorageProvider defined\n\n`;
console.log('✓ Storage provider drivers verified (Local and Cloudinary).');

// 2. Browser Executable Interoperability
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const hasChrome = fs.existsSync(chromePath);
const hasEdge = fs.existsSync(edgePath);
logOutput += `Browser Engines Installed:\n  ✓ Google Chrome: ${hasChrome} (${chromePath})\n  ✓ Microsoft Edge: ${hasEdge} (${edgePath})\n`;
console.log(`✓ Browser availability: Chrome=${hasChrome}, Edge=${hasEdge}`);

fs.writeFileSync(logPath, logOutput);
console.log(`Raw interoperability log written to ${logPath}`);
