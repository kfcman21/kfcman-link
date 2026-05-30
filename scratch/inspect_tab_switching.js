const fs = require('fs');
const appjs = fs.readFileSync('public/app.js', 'utf8');

console.log('--- SEARCHING TAB SWITCH ACTIONS ---');
const regex = /function (?:showShortenerTab|showDashboardTab|showPollsTab|switchTab|selectTab)/gi;

const matches = [];
let match;
while ((match = regex.exec(appjs)) !== null) {
  const segment = appjs.substring(match.index, match.index + 1000).replace(/\n/g, '\n');
  console.log(segment);
  console.log('-------------------------------------------');
}
