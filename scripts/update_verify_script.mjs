import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('scripts/verify_feed_engineering.mjs');
let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

s = s.replace(/const newCount = await verifySortMode\('new', \d+\);/, "const newCount = await verifySortMode('new', 25, 15);");
s = s.replace(/const topCount = await verifySortMode\('top', \d+\);/, "const topCount = await verifySortMode('top', 25, 15);");
s = s.replace(/const hotCount = await verifySortMode\('hot', \d+\);/, "const hotCount = await verifySortMode('hot', 25, 15);");

fs.writeFileSync(file, s.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully updated verify_feed_engineering.mjs');
