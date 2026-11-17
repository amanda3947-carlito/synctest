// Every upload to App Store Connect needs a build number it hasn't seen before.
// `npm run bump` adds one to CURRENT_PROJECT_VERSION in the Xcode project and prints the new number.
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
const src = fs.readFileSync(file, 'utf8');
const nums = [...src.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)].map((m) => Number(m[1]));
if (!nums.length) { console.error('CURRENT_PROJECT_VERSION not found in', file); process.exit(1); }
const next = Math.max(...nums) + 1;
fs.writeFileSync(file, src.replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${next};`));
console.log(`build number is now ${next}`);
