const fs = require('fs');
const appjs = fs.readFileSync('public/app.js', 'utf8');

console.log('--- SEARCHING TAB SWITCHING AND ID REFERENCES ---');
const regex = /(?:section|tab|nav-item|nav_item|menu|dashboard|admin|user|role)/gi;

const matches = [];
let match;
while ((match = regex.exec(appjs)) !== null) {
  const segment = appjs.substring(match.index - 50, match.index + 80).replace(/\n/g, ' ');
  if (!matches.includes(segment)) {
    matches.push(segment);
  }
  if (matches.length >= 25) break;
}

matches.forEach((m, idx) => console.log(`${idx + 1}: ${m}`));
