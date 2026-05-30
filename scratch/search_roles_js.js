const fs = require('fs');
const appjs = fs.readFileSync('public/js/app.js', 'utf8');

console.log('--- ROLES SEARCH IN public/js/app.js ---');
const regex = /(?:role|vip|manager|admin)/gi;
let match;
const matches = [];
while ((match = regex.exec(appjs)) !== null) {
  const lineNum = appjs.substring(0, match.index).split('\n').length;
  const content = appjs.substring(match.index - 50, match.index + 80).replace(/\n/g, ' ');
  const item = `Line ${lineNum}: ${content}`;
  if (!matches.includes(item)) {
    matches.push(item);
  }
  if (matches.length >= 40) break;
}
matches.forEach(m => console.log(m));
